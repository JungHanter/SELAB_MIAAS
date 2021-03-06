/**
 * Created by hanter on 2016. 3. 8..
 */

$(document).ready(function () {
    var imageDate = $('#takenDate');
    imageDate.prop('max', function () {
        return new Date().toJSON().split('T')[0];
    });
    $('#uploadImageForm').on('submit', function (e) {
        e.preventDefault();
        var currentTime = new Date().getTime() + 3600 * 9;
        var minDate = -5367427200000;
        console.log(currentTime);
        console.log(Date.parse(imageDate.val()));
        if (Date.parse(imageDate.val()) > currentTime || Date.parse(imageDate.val()) < minDate) {
            openModal("Recorded date must be after 1800 and before now.", "Upload Failure");
            imageDate.focus();
            return;
        }

        var imageType = $('#imageType').val();
        var filenames = getFiles($('#image_file'));

        if (filenames.length > POSSIBLE_MULTIPLE_IMAGE_UPLOAD_NUM) {
            openModal("Too many files are selected. <br/>The maximum number of files uploaded at once is 300. Please less then 300 files. <br/>" +
                "If you want to upload more files, please compress them as zip file format.", "Upload Failure");
            return;
        }

        for (var i=0; i<filenames.length; i++) {
            var ext = getFileExtension(filenames[i]);
            if (!checkImageTypeAndExtension(imageType, ext)) {
                console.log(ext);
                $('#imageUploadModal').modal('hide');
                openModal('Please upload correct image file for image type.', 'Upload Failure');
                return;
            }
        }

        var data = new FormData($('#uploadImageForm').get(0));
        data.append('action', 'upload');
        data.append('image_info', JSON.stringify({
            user_id: user['user_id'],
            subject: $('#subject').val(),
            image_type: $('#imageType').val(),
            taken_date: Date.parse(imageDate.val()),
            taken_from: $('#takenFrom').val(),
            physician: $('#takenPhysicianName').val(),
            place: $('#clinicName').val(),
            medical_department: $('#medicalDepartment').val(),
            description: $('#imageDescription').val()
        }));
        //console.log(data);

        var xprogressID = new Date().getTime();
        //setTimeout(function() {
        startFileProgressUpdate(xprogressID);
        //}, 100);

        setProgressText('Uploading...');
        $('#uploadingProgressModal').modal({
            backdrop: 'static',
            keyboard: false
        });

        $.ajax({
            url: $(this).attr('action') + '?X-Progress-ID=' + xprogressID,
            type: $(this).attr('method'),
            data: data,
            cache: false,
            processData: false,
            contentType: false,
            success: function (res) {
                //console.log(res);
                if (uploadStatus <= 2) {
                    stopFileProgressUpdate(false);
                    setTimeout(function () {
                        $('#uploadingProgressModal').modal('hide');
                    }, 200);
                } else {
                    stopRotatingProgress();
                    $('#uploadingProgressModal').modal('hide');
                }
                uploadStatus = 0;

                if (res['code'] == 'SUCCESS') {
                    $.LoadingOverlay('show');
                    location.href = archiveURL;
                } else {
                    openModal(res['msg'], "Upload Failure");
                }
            }
        });
    });

    $('#takenFrom').change(function () {
        var tf = $(this).val();
        if (tf == 'Home') {
            //$('#takenPhysicianName').removeAttr('required').val('');
            //$('#clinicName').removeAttr('required').val('');
            //$('#medicalDepartment').removeAttr('required').val('');
            $('#physicianGroup').hide();
            $('#clinicNameGroup').hide();
            $('#medicalDepartmentGroup').hide();
        } else {
            //$('#takenPhysicianName').attr('required', '');
            //$('#clinicName').attr('required', '');
            //$('#medicalDepartment').attr('required', '');
            $('#physicianGroup').show();
            $('#clinicNameGroup').show();
            $('#medicalDepartmentGroup').show();
        }
    });

});
