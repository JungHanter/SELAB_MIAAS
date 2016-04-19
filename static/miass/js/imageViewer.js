/**
 * Created by hanter on 2016. 3. 12..
 */

var graphColors = ['#D76474', '#ADD764', '#8E64D7', '#64D7C7', '#607D8B', '#FFD600',
                   '#1493CC', '#3F51B5', '#FF5722', '#2196F3', '#009688', '#795548'];

var imageDirs = null;
var $imageViewer = null;
var lastImageData = null;
var canvasSize = 512;
var chartWidth = 1100;
var bShowGraphView = false;
var bShowDicomDetail = true;


cornerstoneWADOImageLoader.configure({
    beforeSend: function(xhr) {
        //console.log('beforesend');
        // Add custom headers here (e.g. auth tokens)
        //xhr.setRequestHeader('x-auth-token', 'my auth token');
        showImageViewerLoader(true);
    }
});

var conerstoneloaded = false;

function dicomReadHeader(wadoURL) {
    $('#imageViewShowDetail').text('Detail Information Loading...')
                .unbind('click').off('click');

    var oReq = new XMLHttpRequest();
    try {
        oReq.open("get", wadoURL, true);
    } catch(err) {
        $('#imageViewShowDetail').text('Detail Information Loading Failed');
        $('#imageViewerDetail').hide();
        console.log(err);
        return false;
    }

    oReq.responseType = "arraybuffer";
    oReq.onreadystatechange = function(oEvent) {
        if(oReq.readyState == 4) {
            if(oReq.status == 200) {
                var byteArray = new Uint8Array(oReq.response);

                var kb = byteArray.length / 1024;
                var mb = kb / 1024;
                var byteStr = mb > 1 ? mb.toFixed(3) + " MB" : kb.toFixed(0) + " KB";
                //document.getElementById('statusText').innerHTML = 'Status: Parsing ' + byteStr + ' bytes, please wait..';
                console.log('Status: Parsing ' + byteStr + ' bytes, please wait..');
                // set a short timeout to do the parse so the DOM has time to update itself with the above message
                setTimeout(function() {
                    // Invoke the paresDicom function and get back a DataSet object with the contents
                    var dataSet;
                    try {
                        dataSet = dicomParser.parseDicom(byteArray);
                        dicomShowDataSet(dataSet);

                        $('#imageViewShowDetail').text('Hide Detail Information')
                            .unbind('click').off('click').click(function() {
                                bShowDicomDetail = false;
                                $('#imageViewerDetail').hide();
                                $('#imageViewShowDetail').text('Show Detail Information')
                                        .unbind('click').off('click').click(function() {
                                    dicomReadHeader(wadoURL);
                                    bShowDicomDetail = true;
                                });
                            });

                    } catch (err) {
                        $('#imageViewShowDetail').text('Detail Information Loading Failed');
                        $('#imageViewerDetail').hide();
                        console.log(err);
                    }
                }, 30);

            } else {
                $('#imageViewShowDetail').text('Detail Information Loading Failed');
                $('#imageViewerDetail').hide();
                console.log(oEvent);
            }
        }
    };
    oReq.send();
}

function dicomShowDataSet(dataSet) {
    $('#imageViewerDetail span[data-dicom]').each(function(index, value) {
        var attr = $(value).attr('data-dicom');
        var element = dataSet.elements[attr];
        var text = "";
        if(element !== undefined)
        {
            var str = dataSet.string(attr);
            if(str !== undefined) {
                text = str;
            }
        }
        $(value).text(text);
    });

    $('#imageViewerDetail span[data-dicomUint]').each(function(index, value) {
        var attr = $(value).attr('data-dicomUint');
        var element = dataSet.elements[attr];
        var text = "";
        if(element !== undefined)
        {
            if(element.length === 2)
            {
                text += dataSet.uint16(attr);
            }
            else if(element.length === 4)
            {
                text += dataSet.uint32(attr);
            }
        }

        $(value).text(text);
    });

    $('#imageViewerDetail').show();
}

function dicomloadAndView(dicomURL) {

    // prefix the url with wadouri: so cornerstone can find the image loader
    var wadoURI = "wadouri:" + dicomURL;

    var element = $('#imageViewer').get(0);
    showImageViewerLoader(true);
    try {
        cornerstone.loadAndCacheImage(wadoURI).then(function(image) {
            console.log(image);
            var viewport = cornerstone.getDefaultViewportForImage(element, image);
            cornerstone.displayImage(element, image, viewport);
            if(conerstoneloaded === false) {
                cornerstoneTools.mouseInput.enable(element);
                cornerstoneTools.mouseWheelInput.enable(element);
                cornerstoneTools.wwwc.activate(element, 1); // ww/wc is the default tool for left mouse button
                cornerstoneTools.pan.activate(element, 2); // pan is the default tool for middle mouse button
                cornerstoneTools.zoom.activate(element, 4); // zoom is the default tool for right mouse button
                cornerstoneTools.zoomWheel.activate(element); // zoom is the default tool for middle mouse wheel
                conerstoneloaded = true;
            }

            //
            //$('#imageViewShowDetail').text('Show Detail Information').show()
            //        .unbind('click').off('click').click(function() {
            //    dicomReadHeader(dicomURL);
            //});
            $('#imageViewerDetailContainer').show();
            $('#imageViewShowDetail').show();
            if (bShowDicomDetail) {
                $('#imageViewShowDetail').text('Loading Detail Information...');
                dicomReadHeader(dicomURL);
            } else {
                $('#imageViewerDetail').hide();
                $('#imageViewShowDetail').text('Show Detail Information')
                        .unbind('click').off('click').click(function() {
                    dicomReadHeader(dicomURL);
                    bShowDicomDetail = true;
                });
            }

            console.log('dicom loaded');
            showImageViewerLoader(false);

        }, function(err) {
            console.log(err);
            showImageViewerLoader(false);
            openModal(err, "DICOM Loading Failed");
        });
    }
    catch(err) {
        console.log(err);
        showImageViewerLoader(false);
        openModal(err, "DICOM Loading Failed");
    }
}

function generalImageLoadAndView(imageURL) {
    var canvas = $('#imageViewer canvas')[0];
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var image = new Image();

    showImageViewerLoader(true);
    image.addEventListener("load", function () {
        //var canvasSize = canvas.width;
        var drawingWidth = image.width;
        var drawingHeight = image.height;
        var magni = 1;
        if (canvasSize >= image.height) {
            var magni = canvasSize/image.width;
        } else {
            var magni = canvasSize/image.height;
        }
        drawingWidth *= magni;
        drawingHeight *= magni;
        ctx.drawImage(image, 0, 0, drawingWidth, drawingHeight);
        showImageViewerLoader(false);
    });
    image.src = imageURL;
}

var graph = null;
function csvGrpahLoadAndView(csvURL) {
    showImageViewerLoader(true);
    setTimeout(function() {
        var data = csvURL;
        smoothPlotter.smoothing = 0.333;

        var elem = null;
        if(bShowGraphView) elem = document.getElementById("graphViewer");
        else elem = document.getElementById("imageViewer");

        var g = new Dygraph (
            elem,
            data, {
                //labels: [ "Time", "Direct_1", "Abdomen_1"],
                width: chartWidth,
                height: canvasSize,
                //valueRange: [-3, 5.1],
                axes: {
                    y: {
                        drawAxis: true
                    }, x: {
                        drawAxis: true,
                        drawGrid: true
                    }
                },
                animatedZooms: true,
                strokeWidth: 2,
                //color: '#D76474',
                colors: graphColors,
                plotter: smoothPlotter,
                ylabel: 'Micro Volt (μV)',
                xlabel: 'Time (ms)'


                //visibility: [true, true, true, false, false, false],
                //drawCallback: function(g) {
                //    console.log(g.getLabels());
                //}
            }
        );
        g.ready(function(g) {
            console.log(g.getLabels());
            var lables = g.getLabels();

            var timeLable = lables[0];
            if(timeLable.length != 0 && !/^[\s]*$/.test(timeLable) && timeLable.trim().toLowerCase() != 'time') {
                $('#graphView .dygraph-xlabel').text(timeLable);
            }

            if (lables.length > 2) {
                var startLabel = 1;
                if (lables.length > 3 && lables[1].trim().toLowerCase().startsWith('time')) {
                    startLabel = 2;
                    g.setVisibility(0, false);
                }

                $('#graphLabelChecks').show();
                var checkboxesHTMLString = "";
                for (var i = startLabel; i < lables.length; i++) {
                    checkboxesHTMLString += '<div class="checkbox"><label style="color:'
                        + graphColors[i - 1] + ';"><input type="checkbox" data-column="' + (i - 1)
                        + '"> ' + lables[i] + '</label></div>'
                }
                //checkboxesHTMLString += '<button id="columnChangeBtn" class="btn btn-primary">Show</button>';
                $('#graphLabelChecks').empty().html(checkboxesHTMLString);
                $('#graphLabelChecks input:checkbox').prop('checked', true).change(function () {
                    var pos = parseInt($(this).data('column'));
                    g.setVisibility(pos, $(this).prop('checked'));
                });

                //$('#columnChangeBtn').off('click').unbind('click').click(function() {
                //    var labelCnt = lables.length-1;
                //    var arrVisibility = new Array(labelCnt);
                //    $('#graphLabelChecks input:checkbox').each(function() {
                //        var pos = parseInt($(this).data('column'));
                //        arrVisibility[pos] = $(this).prop('checked');
                //        g.setVisibility(pos, $(this).prop('checked'));
                //    });
                //    //g.setVisibility(arrVisibility);
                //});
            } else {
                $('#graphLabelChecks').hide();
            }
        });

        $('#rollPeriodConfirm').off('click');
        $('#rollPeriodConfirm').click(function() {
            var roll = $('#rollPeriod').val();
            if(roll < 0) {
                roll = 0;
                $('#rollPeriod').val(0);
            }
            g.adjustRoll(roll);
        });

        showImageViewerLoader(false);
    }, 10);
}

function showViewExploerer(bShow) {
    if(bShow == undefined || bShow == null) bShow = true;

    if(bShow) {
        $('.image-view-explorer').show();
        $('.image-view-image').removeClass('col-sm-12')
            .addClass('col-sm-7').addClass('col-md-8');
    } else {
        $('.image-view-explorer').hide();
        $('.image-view-image').removeClass('col-sm-7').removeClass('col-md-8')
            .addClass('col-sm-12');
    }
}


function showGraphView(bShow) {
    if(bShow == undefined || bShow == null) bShow = true;
    bShowGraphView = bShow;

    if(bShow) {
        $('#imageView').hide();
        $('#graphView').show();
    } else {
        $('#graphView').hide();
        $('#imageView').show();
    }
}

function downloadAndView(tagData){
    showDicomSequenceLoader(false);

    lastImageData = tagData;
    console.log(tagData['dir']);
    var url = makeURL(tagData['dir']);
    if(tagData['type'] == 'dcm') {
        // image enable the dicomImage element and activate a few tools
        dicomloadAndView(url);
        $('#imageViewModalTitleName').text(tagData['name']);
        //showImageViewerLoader(false);
    } else if (tagData['type'] == 'csv') {
        csvGrpahLoadAndView(url);
    } else {
        generalImageLoadAndView(url);
        $('#imageViewModalTitleName').text(tagData['name']);
    }
}

var dicomSeq = [];
var dicomPlayingSequenceInterval = null;
var dicomPlayingLoadWaitingInterval = null;
var dicomSeqCnt = 0;
var dicomSeqPlaying = false;
var dicomSeqForward = true;
var dicomSeqDragging = false;
var dicomSeqSegRepeting = false;
var dicomSeqSegRepetingAB = true;
var dicomSeqSegA = 0,  dicomSeqSegB = 0;

function setPlayDicomSequence(images) {
    dicomSeq = [];
    dicomPlayingSequenceInterval = null;
    dicomPlayingLoadWaitingInterval = null;
    dicomSeqCnt = 0;
    dicomSeqPlaying = false;
    dicomSeqForward = true;
    dicomSeqDragging = false;
    dicomSeqSegRepeting = false;
    dicomSeqSegRepetingAB = true;
    dicomSeqSegA = 0;
    dicomSeqSegB = 0;

    $('#imageViewModalTitleName').text(images['title']);
    var files = images.files.split(':');

    var imageViewer = $('#imageViewer').get(0);
    var canvas = $('#imageViewer canvas')[0];
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    $('#imageViewerDetailContainer').hide();
    $('#imageViewShowDetail').hide();

    setTimeout(function() {
        showImageViewerLoader(false);
        showDicomSequenceLoader(true);
        //showImageViewerLoader(true);
        //showDicomSequenceLoader(false);
    });
    $('#sequenceLoaderStatus').text('0/' + files.length);

    var fileCnt = files.length, loadCnt = 0;

    try {
        for (var idx = 0; idx < files.length; idx++) {
            var wadoURI = "wadouri:" + makeURL(files[idx]);
            cornerstone.loadAndCacheImage(wadoURI).then(function (image) {
                //console.log(image);
                dicomSeq.push(image);
                loadCnt++;
            }, function(err) {
                console.log(err);
                fileCnt--;
            });
        }

        dicomPlayingLoadWaitingInterval = setInterval(function () {
            setTimeout(function() {
                $('#sequenceLoaderStatus').text(dicomSeq.length + '/' + files.length);
            }, 10);

            //console.log(loadCnt + '/' + fileCnt);

            if (loadCnt == fileCnt) {
                clearInterval(dicomPlayingLoadWaitingInterval);
                dicomPlayingLoadWaitingInterval = null;

                dicomSeq.sort(function(a, b) {
                    return cmpStringsWithNumbers(a.imageId.toString(), b.imageId.toString());
                });

                showDicomSequenceLoader(false);
                showImageViewerLoader(false);

                dicomSeqSegA = 0;
                dicomSeqSegB = dicomSeq.length-1;
                $('#seqControllerProgress .progress-bar-primary').attr('aria-valuemax', dicomSeq.length-1)
                    .attr('aria-valuenow', 0).css({width: '0%'});

                $('#imageViewerSequenceController').show();
                try {
                    dicomSeqPlaying = true;
                    dicomPlayingSequenceInterval = setInterval(function () {
                        if(dicomSeqDragging) return;

                        var element = $('#imageViewer').get(0);
                        displayImageSequence(imageViewer, dicomSeqCnt);
                        /*if(conerstoneloaded === true) {
                            cornerstoneTools.mouseInput.disable(element);
                            cornerstoneTools.mouseWheelInput.disable(element);
                            cornerstoneTools.wwwc.deactivate(element, 1); // ww/wc is the default tool for left mouse button
                            cornerstoneTools.pan.deactivate(element, 2); // pan is the default tool for middle mouse button
                            cornerstoneTools.zoom.deactivate(element, 4); // zoom is the default tool for right mouse button
                            cornerstoneTools.zoomWheel.deactivate(element); // zoom is the default tool for middle mouse wheel
                            conerstoneloaded = false;
                        }*/
                        if(conerstoneloaded === false) {
                            cornerstoneTools.mouseInput.enable(element);
                            cornerstoneTools.mouseWheelInput.enable(element);
                            cornerstoneTools.wwwc.activate(element, 1); // ww/wc is the default tool for left mouse button
                            cornerstoneTools.pan.activate(element, 2); // pan is the default tool for middle mouse button
                            cornerstoneTools.zoom.activate(element, 4); // zoom is the default tool for right mouse button
                            cornerstoneTools.zoomWheel.activate(element); // zoom is the default tool for middle mouse wheel
                            conerstoneloaded = true;
                        }

                        dicomSeqCnt++;
                        if(dicomSeqCnt >= dicomSeq.length) dicomSeqCnt = 0;
                    }, 50);

                    $('#seqControllerPause').click(function() {
                        if(dicomSeqPlaying) {
                            clearInterval(dicomPlayingSequenceInterval);
                            dicomSeqPlaying = false;

                            $('#seqControllerStepBackward').removeClass('disabled').click(function() {
                                dicomSeqCnt--;
                                if(dicomSeqCnt < 0) dicomSeqCnt = dicomSeq.length - 1;
                                displayImageSequence(imageViewer, dicomSeqCnt);
                            });
                            $('#seqControllerStepForward').removeClass('disabled').click(function() {
                                dicomSeqCnt++;
                                if(dicomSeqCnt >= dicomSeq.length) dicomSeqCnt = 0;
                                displayImageSequence(imageViewer, dicomSeqCnt);
                            });
                        }

                        displayImageSequence(imageViewer, dicomSeqCnt);
                    });

                    $('.btn-seq-play').click(function() {
                        if(dicomSeqPlaying) clearInterval(dicomPlayingSequenceInterval);

                        $('#seqControllerStepBackward').off('click').unbind('click').addClass('disabled');
                        $('#seqControllerStepForward').off('click').unbind('click').addClass('disabled');

                        if($(this).attr('id') == 'seqControllerPlay') {
                            dicomSeqForward = true;
                        } else if ($(this).attr('id') == 'seqControllerBackward') {
                            dicomSeqForward = false;
                        }

                        dicomPlayingSequenceInterval = setInterval(function() {
                            if(dicomSeqDragging) return;
                            displayImageSequence(imageViewer, dicomSeqCnt);

                            if(dicomSeqForward) {
                                dicomSeqCnt++;
                                if(dicomSeqCnt >= dicomSeq.length) dicomSeqCnt = 0;
                            } else {
                                dicomSeqCnt--;
                                if(dicomSeqCnt < 0) dicomSeqCnt = dicomSeq.length - 1;
                            }
                        }, 50);

                        dicomSeqPlaying = true;
                    });

                    $('#seqControllerSegmentA').click(function() {
                        dicomSeqSegA = dicomSeqCnt;
                        $('#seqControllerProgressSegA').show().css({
                            left: (5+(dicomSeqSegA/(dicomSeq.length-1)*canvasSize)) + 'px'
                        });
                    });
                    $('#seqControllerSegmentB').click(function() {
                        dicomSeqSegB = dicomSeqCnt;
                        $('#seqControllerProgressSegB').show().css({
                            left: (5+(dicomSeqSegB/(dicomSeq.length-1)*canvasSize)) + 'px'
                        });
                    });
                    $('#seqControllerSegmentClear').click(function() {
                        dicomSeqSegRepeting = false;
                        dicomSeqSegA = 0;
                        dicomSeqSegB = dicomSeq.length-1;
                        $('#seqControllerProgressSegA').hide();
                        $('#seqControllerProgressSegB').hide();
                    });
                    $('.btn-seq-seg-play').click(function() {
                        if(dicomSeqPlaying) clearInterval(dicomPlayingSequenceInterval);

                        $('#seqControllerStepBackward').off('click').unbind('click').addClass('disabled');
                        $('#seqControllerStepForward').off('click').unbind('click').addClass('disabled');

                        if($(this).attr('id') == 'seqControllerSegmentRepetitionAB') {
                            dicomSeqSegRepetingAB = true;
                        } else if ($(this).attr('id') == 'seqControllerSegmentRepetitionBA') {
                            dicomSeqSegRepetingAB = false;
                        }

                        dicomPlayingSequenceInterval = setInterval(function() {
                            if(dicomSeqDragging) return;
                            displayImageSequence(imageViewer, dicomSeqCnt, true);

                            if(dicomSeqSegRepetingAB) { //A->B
                                dicomSeqCnt++;
                                if (dicomSeqSegA <= dicomSeqSegB) { //A->B
                                    if(dicomSeqCnt > dicomSeqSegB) dicomSeqCnt = dicomSeqSegA;
                                } else { //A->last->first->B
                                    if(dicomSeqCnt >= dicomSeq.length) dicomSeqCnt = 0;
                                    else if(dicomSeqCnt == dicomSeqSegB+1) dicomSeqCnt = dicomSeqSegA;
                                }

                            } else {
                                dicomSeqCnt--;
                                if (dicomSeqSegA <= dicomSeqSegB) { //A<-B
                                    if (dicomSeqCnt < dicomSeqSegA) dicomSeqCnt = dicomSeqSegB;
                                } else { //A<-last<-first<-B
                                    if(dicomSeqCnt < 0) dicomSeqCnt = dicomSeq.length - 1;
                                    else if(dicomSeqCnt == dicomSeqSegA-1) dicomSeqCnt = dicomSeqSegB;
                                }
                            }
                        }, 50);

                        dicomSeqSegRepeting = true;
                        dicomSeqPlaying = true;
                    });

                    $('#seqControllerSegmentRepetition').click(function() {
                    });

                } catch (err) {
                    console.log(err);
                    showDicomSequenceLoader(false);
                    showImageViewerLoader(false);
                    stopDicomSequence();
                    openModal(err, "DICOM Loading Failed");
                    return;
                }
            }
        }, 50);
    } catch (err) {
        stopDicomSequence();
        showDicomSequenceLoader(false);
        showImageViewerLoader(false);
        openModal(err, "DICOM Loading Failed");
        return;
    }
}

function displayImageSequence(imageViewer, nowCnt, segRepeting) {
    if(segRepeting == undefined || segRepeting == null) segRepeting = false;

    var image = dicomSeq[nowCnt];
    var viewport = cornerstone.getDefaultViewportForImage(imageViewer, image);
    cornerstone.displayImage(imageViewer, image, viewport);

    if(segRepeting) {
        var marginLeft = dicomSeqSegA / (dicomSeq.length - 1) * canvasSize;
        var width = (nowCnt - dicomSeqSegA) / (dicomSeq.length - 1) * canvasSize;

        if(dicomSeqSegA > dicomSeqSegB && nowCnt <= dicomSeqSegB) {
            var segBarWidth = nowCnt / (dicomSeq.length - 1) * canvasSize;
            $('#seqControllerProgress .progress-bar-for-seg')
                .show().css({
                    width: segBarWidth + 'px'
                });

            width = (dicomSeq.length-dicomSeqSegA) * canvasSize;
        } else {
            $('#seqControllerProgress .progress-bar-for-seg').hide();
        }

        $('#seqControllerProgress .progress-bar-primary')
            .attr('aria-valuenow', nowCnt).css({
                'margin-left': marginLeft + 'px',
                //width: (nowCnt/(dicomSeq.length-1)*100)+'%',
                width: width + 'px'
            });

    } else {
        $('#seqControllerProgress .progress-bar-for-seg').hide();
        $('#seqControllerProgress .progress-bar-primary')
            .attr('aria-valuenow', nowCnt).css({
                'margin-left': '0',
                width: (nowCnt/(dicomSeq.length-1)*100)+'%'
            });
    }
    $('#seqControllerProgressText').text((nowCnt+1)+' / ' + dicomSeq.length);
}

function stopDicomSequence() {
    $('#imageViewerSequenceController').hide();
    $('#seqControllerStepBackward').off('click').unbind('click').addClass('disabled');
    $('#seqControllerBackward').off('click').unbind('click');
    $('#seqControllerPause').off('click').unbind('click');
    $('#seqControllerPlay').off('click').unbind('click');
    $('#seqControllerStepForward').off('click').unbind('click').addClass('disabled');

    if(dicomPlayingLoadWaitingInterval != null) {
        clearInterval(dicomPlayingLoadWaitingInterval);
        dicomPlayingLoadWaitingInterval = null;
    }
    if(dicomPlayingSequenceInterval != null) {
        clearInterval(dicomPlayingSequenceInterval);
        dicomPlayingSequenceInterval = null;
    }
}

function setDicomSequenceProgressbar() {
    $('#seqControllerProgress').mousedown(function() {
        dicomSeqDragging = true;
    }).mouseup(function(e) {
        dicomSeqDragging = false;

        var parentOffset = $(this).parent().offset();
        var relXOffset = e.pageX - parentOffset.left;
        var seqOffset = Math.round(relXOffset/$(this).width()*(dicomSeq.length-1));
        if (seqOffset < 0) seqOffset = 0;
        else if (seqOffset > dicomSeq.length-1) seqOffset = dicomSeq.length-1;

        dicomSeqCnt = seqOffset;
        displayImageSequence($('#imageViewer').get(0), dicomSeqCnt);
    }).mousemove(function(e) {
        if(dicomSeqDragging) {
            var parentOffset = $(this).parent().offset();
            var relXOffset = e.pageX - parentOffset.left;
            var seqOffset = Math.round(relXOffset/$(this).width()*(dicomSeq.length-1));
            if (seqOffset < 0) seqOffset = 0;
            else if (seqOffset > dicomSeq.length-1) seqOffset = dicomSeq.length-1;

            dicomSeqCnt = seqOffset;
            displayImageSequence($('#imageViewer').get(0), dicomSeqCnt);
        }
    }); //리스너부분 코드 function 하나로 만들면 제대로 동작 안함

    $('body').mouseup(function(e) {
        dicomSeqDragging = false;
    });

}

// Regular expression to separate the digit string from the non-digit strings.
var reParts = /\d+|\D+/g;
// Regular expression to test if the string has a digit.
var reDigit = /\d/;
// Add cmpStringsWithNumbers to the global namespace.  This function takes to
// strings and compares them, returning -1 if `a` comes before `b`, 0 if `a`
// and `b` are equal, and 1 if `a` comes after `b`.
cmpStringsWithNumbers = function(a, b) {
    // Get rid of casing issues.
    a = a.toUpperCase();
    b = b.toUpperCase();

    // Separates the strings into substrings that have only digits and those
    // that have no digits.
    var aParts = a.match(reParts);
    var bParts = b.match(reParts);

    // Used to determine if aPart and bPart are digits.
    var isDigitPart;

    // If `a` and `b` are strings with substring parts that match...
    if(aParts && bParts &&
        (isDigitPart = reDigit.test(aParts[0])) == reDigit.test(bParts[0])) {
        // Loop through each substring part to compare the overall strings.
        var len = Math.min(aParts.length, bParts.length);
        for(var i = 0; i < len; i++) {
            var aPart = aParts[i];
            var bPart = bParts[i];

            // If comparing digits, convert them to numbers (assuming base 10).
            if(isDigitPart) {
                aPart = parseInt(aPart, 10);
                bPart = parseInt(bPart, 10);
            }

            // If the substrings aren't equal, return either -1 or 1.
            if(aPart != bPart) {
                return aPart < bPart ? -1 : 1;
            }

            // Toggle the value of isDigitPart since the parts will alternate.
            isDigitPart = !isDigitPart;
        }
    }

    // Use normal comparison.
    return (a >= b) - (a <= b);
};

function makeURL(relativeURL) {
    return SERVER_ADDRESS + '/api/archive?image_user_id=' + imageInfo['user_id']
        + '&image_id=' + imageInfo['image_id']
        + '&image_dir=' + relativeURL;
}

$(cornerstone).bind('CornerstoneImageLoadProgress', function(eventData) {
    console.log(eventData);
    console.log('Image Load Progress: ' + eventData.percentComplete + "%");
    $('#loadProgress').text('Image Load Progress: ' + eventData.percentComplete + "%");
});

$(document).ready(function() {
    $('#rollPeriodLabel').popover();
    $('#btnImageControlHelp').popover();

    resizeViewer();
    window.addEventListener("resize", resizeViewer);

    showImageViewerLoader(false);
    $('#imageViewModal').on('show.bs.modal', function(e) {
        resizeViewer();

        if (lastImageData != null) {
            downloadAndView(lastImageData);
        }
    });

    var imageContainer = $('#imageViewer').get(0);
    cornerstone.enable(imageContainer);

    setDicomSequenceProgressbar();

    //$('.image-view-image').scroll(function(e) {
    //    console.log(e);
    //    console.log(e);
    //});
});

function openImageViewer() {
    $.LoadingOverlay('show');

    setTimeout(function() {
        resizeViewer();

        if(bShowGraphView) {
            $('#graphViewer').empty();
            for (var rootName in imageDirs) {
                var rootImgInfo = imageDirs[rootName];

                if (rootImgInfo['type'] == 'csv') {
                    lastImageData = {
                        type: rootImgInfo['type'],
                        dir: rootImgInfo['dir'],
                        name: imageInfo['subject']
                    };
                    console.log(lastImageData);
                }
                break;
            }
        } else {
            var listExplorer = $('#image-view-list');
            listExplorer.empty();
            for (var rootName in imageDirs) {
                var rootImgInfo = imageDirs[rootName];

                if (rootImgInfo['type'] == 'folder') {
                    for (var dirName in rootImgInfo['file_list']) {
                        var dirs = rootImgInfo['file_list'][dirName];
                        listExplorer.append('<li>' + generateExplorer(dirs, dirName) + '</li>');
                    }
                } else {
                    listExplorer.append('<span><a data-dir="' + rootImgInfo['dir']
                        + '" data-type="' + rootImgInfo['type'] + '">'
                        + imageInfo['subject'] + '<a/></span>');
                    lastImageData = {
                        type: rootImgInfo['type'],
                        dir: rootImgInfo['dir'],
                        name: imageInfo['subject']
                    };
                }
                break;
            }

            $('#image-view-list a.image-explorer-list-item').each(function (elem) {
                $(this).off('click').unbind('click');
                $(this).click(function () {
                    //console.log($(this).data());
                    var imageData = $(this).data();
                    imageData['name'] = $(this).text();
                    stopDicomSequence();
                    downloadAndView(imageData);
                });
            });

            $('#image-view-list a.image-explorer-list-play').each(function (elem) {
                $(this).off('click').unbind('click');
                $(this).click(function () {
                    var images = $(this).data();
                    stopDicomSequence();
                    setPlayDicomSequence(images);
                });
            });

            $('#image-view-list a.image-view-list-expander').each(function (elem) {
                $(this).off('click').unbind('click');
                if(!$(this).data('expanded')) {
                    $(this).parent().parent().find('> ul').hide();
                }

                $(this).click(function() {
                    var expanded = $(this).data('expanded');
                    if (expanded) {
                        $(this).removeClass('glyphicon-collapse-down').addClass('glyphicon-expand');
                        $(this).parent().parent().find('> ul').hide();
                    } else {
                        $(this).removeClass('glyphicon-expand').addClass('glyphicon-collapse-down');
                        $(this).parent().parent().find('> ul').show();
                    }
                    $(this).data('expanded', !expanded);
                });
            });
        }

        console.log('image view modal opened');
        $.LoadingOverlay('hide');
        $('#imageViewModal').off('hidden.bs.modal').on('hidden.bs.modal', function() {
            $('#imageViewShowDetail').hide();
            stopDicomSequence();
            showDicomSequenceLoader(false);
        });
        $('#imageViewModal').modal({backdrop: 'static'});
    }, 0);
}

function generateExplorer(dirs, name) {
    if (dirs['type'] == 'folder') {
        //var htmlString = '<span>' + name + '▶' + '</span><ul>';
        var htmlString = '';
        //for (var dirName in dirs['file_list']) {
        //var childDirs = dirs['file_list'][dirName];
        var dirKeys = [];
        for (var dirkey in dirs['file_list']) {
            dirKeys.push(dirkey);
        }
        dirKeys.sort(cmpStringsWithNumbers);

        if (dirKeys.length >= 1) {
            var bHasFile = false;
            var fileList = [];
            for (var i=0; i<dirKeys.length; i++) {
                var file = dirs['file_list'][dirKeys[i]];
                if (file['type'] == 'dcm' || file['type'] == 'dicom') {
                    bHasFile = true;
                    fileList.push(file['dir']);
                }
            }

            htmlString = '<span>' + '<a aria-hidden="true" class="image-view-list-expander glyphicon ';
            if (bHasFile) htmlString += 'glyphicon-expand" data-expanded="false';
            else htmlString += 'glyphicon-collapse-down" data-expanded="true';
            htmlString += '"></a>&nbsp;' + name;
            if (bHasFile && fileList.length >= 2) {
                //console.log(fileList.join(':'));
                htmlString += '&nbsp;<a class="image-explorer-list-play" '
                    + 'data-files="' + fileList.join(':') + '" data-title="' + name
                    + '"><span class="glyphicon glyphicon-play" aria-hidden="true"></span>Play&nbsp;</a></span> <ul>';
            } else {
                htmlString += '</span><ul>';
            }

            for (var i=0; i<dirKeys.length; i++) {
                var dirName = dirKeys[i];
                var childDirs = dirs['file_list'][dirName];
                htmlString += '<li>'+generateExplorer(childDirs, dirName)+'</li>'
            }
            htmlString += '</ul>';
        }
        return htmlString;
    } else {
        return '<a class="image-explorer-list-item" data-dir="'+dirs['dir']
            + '" data-type="'+dirs['type']+'">'+name+'</a>';
    }
}

function setOpenImageViewerListener(elem) {
    //console.log('set listener');
    //$('#imageViewer').empty();
    //console.log(imageInfo);
    //console.log(imageInfo['image_dir'].endsWith('.csv'));

    if(imageInfo['image_dir'].endsWith('.csv')) {
        showGraphView();
    //} else if(imageInfo['image_dir'].endsWith('.jpg') ||
    //          imageInfo['image_dir'].endsWith('.jpeg') ||
    //          imageInfo['image_dir'].endsWith('.png')){
    //    $('#imageViewer').append('<canvas></canvas>');
    } else {
        showGraphView(false);
        //var imageContainer = $('#imageViewer').get(0);
        //cornerstone.enable(imageContainer);
    }

    $imageViewer = elem;
    if (imageDirs == null) {
        $.LoadingOverlay('show');
        $.ajax("/api/medical_image", {
            method: 'GET',
            data: {
                action: 'getImageDirs',
                user_id: user['user_id'],
                image_id: imageInfo['image_id'],
                image_dir: imageInfo['image_dir']
            }, dataType: 'json',
                success: function (res) {
                $.LoadingOverlay('hide');
                if(res['code'] == 'SUCCESS') {
                    imageDirs = res['image_list'];
                    $imageViewer.click(function() {
                        openImageViewer();
                    });
                    showThumbnail();
                } else {
                    openModal(res['msg'], "Image Loading Failed");
                }
            }
        });
    }
}

function resizeViewer() {
    //console.log($(window).width() + ', ' + $(window).height())
    var windowWidth = $(window).width();
    canvasSize = 512;
    chartWidth = 1100;
    if (windowWidth < 768) {
        canvasSize = 320;
        chartWidth = windowWidth;
    } else if (windowWidth < 992) {
        canvasSize = 360;
        chartWidth = 680;
    } else if (windowWidth < 1200) {
        canvasSize = 512;
        chartWidth = 900;
    }

    if(bShowGraphView) {
        var sizeStyle = {width: chartWidth + 'px', height: canvasSize + 'px'};
        $('#graphViewer').css(sizeStyle);
        $('#graphViewer').attr('width', chartWidth).attr('height', canvasSize);
    } else {
        var sizeStyle = {width: canvasSize + 'px', height: canvasSize + 'px'};
        //console.log(sizeStyle);
        $('#imageViewerWrapper').attr('width', canvasSize).attr('height', canvasSize).css(sizeStyle);
        $('#imageViewer').attr('width', canvasSize).attr('height', canvasSize).css(sizeStyle);
        //$('#imageViewer').attr('style', "width:"+canvasSize+"px; height:+"+canvasSize+"px; position:relative; color:white;");
        $('#imageViewerLoader').attr('width', canvasSize).attr('height', canvasSize).css(sizeStyle);
        $('#imageViewerSequenceLoader').attr('width', canvasSize).attr('height', canvasSize).css(sizeStyle);
        $('#imageViewer canvas').attr('width', canvasSize).attr('height', canvasSize).css(sizeStyle);
        $('#imageViewerSequenceController').css({width: canvasSize+'px'});
        $('#imageViewerSequenceController .progress-text').css({width: canvasSize+'px'});

        if(dicomSeq.length >= 2) {
            $('#seqControllerProgressSegA').css({
                left: (5 + (dicomSeqSegA / (dicomSeq.length - 1) * canvasSize)) + 'px'
            });
            $('#seqControllerProgressSegB').css({
                left: (5 + (dicomSeqSegB / (dicomSeq.length - 1) * canvasSize)) + 'px'
            });
        }
    }
}

function showImageViewerLoader(bShow) {
    if(bShow) $('#imageViewerLoader').show();
    else $('#imageViewerLoader').hide();
}

function showDicomSequenceLoader(bShow) {
    if(bShow) $('#imageViewerSequenceLoader').show();
    else $('#imageViewerSequenceLoader').hide();
}

function resetViewer() {
    $('#image-view-list a').each(function(elem) {
        $(this).off('click');
    });
    $imageViewer.off('click');
    imageDirs = null;
    lastImageData = null;
    showImageViewerLoader(false);
    $('#imageViewModalTitleName').text('');
    var imageContainer = $('#imageViewer').get(0);
    //cornerstone.disable(imageContainer);
    //$('#imageViewer').unbind('mousemove');
    //$('#imageViewer').unbind('mousedown');

    //console.log('reset view');
    setOpenImageViewerListener($imageViewer);
}