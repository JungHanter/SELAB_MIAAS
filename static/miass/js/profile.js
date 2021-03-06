/**
 * Created by hanter on 2016. 2. 23..
 */

var profiles = [];

$(document).ready(function () {
    $.LoadingOverlay('show');
    $.ajax("api/patient_profile", {
        method: 'GET',
        data: {
            user_id: user.user_id
        },
        dataType: 'json',
        success: function (res) {
            $.LoadingOverlay('hide');
            //console.log(JSON.stringify(res));
            if (res['code'] == 'SUCCESS') {
                profiles = res['profiles'];
                resetProfile();
            } else {
                openUpdateFailModal(res['msg'], 'Profile Get Failure');
            }
        }
    });

    $('#btnFormReset').click(resetProfile);
    $('#patientProfileForm').on('submit', function (e) {
        e.preventDefault();
        updateProfile();
    });

    var heightType = $('#heightType');
    var height = $('#height');
    heightType.change(function () {
        if (heightType.val() == "Centimeters") {
            height.attr('min', 60);
            height.attr('max', 300);
        }
        else if (heightType.val() == 'Inch') {
            height.attr('min', 23);
            height.attr('max', 120);
        }
        else if (heightType.val() == 'Feet') {
            height.attr('min', 2);
            height.attr('max', 10);
        }
    });

    var weightType = $('#weightType');
    var weight = $('#weight');
    weightType.change(function () {
        if (weightType.val() == "Kilogram") {
            weight.attr('min', 30);
            weight.attr('max', 500);
        }
        else if (weightType.val() == 'Pound') {
            weight.attr('min', 66);
            weight.attr('max', 1100);
        }
    });
});

function resetProfile() {
    $('#patientProfileForm input, #patientProfileForm textarea').each(function () {
        $(this).val('');
    });

    //console.log(profiles);

    for (var i in profiles) {
        var profile = profiles[i];

        if (profile.type == "height") {
            var height = profile.value.split(" ");
            $('#height').val(height[0]);
            var heightType = $('#heightType');
            heightType.val(height[1]).attr("selected", "selected");
            if (heightType.val() == "Centimeters") {
                $('#height').attr('min', 60);
                $('#height').attr('max', 300);
            }
            else if (heightType.val() == 'Inch') {
                $('#height').attr('min', 23);
                $('#height').attr('max', 120);
            }
            else if (heightType.val() == 'Feet') {
                $('#height').attr('min', 2);
                $('#height').attr('max', 10);
            }
        } else if (profile.type == "weight") {
            var weight = profile.value.split(" ");
            var weightType = $('#weightType');
            $('#weight').val(weight[0]);
            weightType.val(weight[1]).attr("selected", "selected");
            if (weightType.val() == "Kilogram") {
                $('#weight').attr('min', 30);
                $('#weight').attr('max', 500);
            }
            else if (weightType.val() == 'Pound') {
                $('#weight').attr('min', 66);
                $('#weight').attr('max', 1100);
            }
        } else if (profile.type == "smoking") {
            $('#smoking').val(profile.value).attr("selected", "selected");
        } else {
            $('#' + profile.type).val(profile.value);
        }
    }
}

var newProfiles = [];
function updateProfile() {
    console.log(profiles);
    newProfiles = [];

    //check form
    var height = $('#height');
    if (height.val() <= 0 && height.val() != "") {
        openUpdateFailModal('Height must be larger than 0.', 'Update Failure');
        height.focus();
        return
    }
    var weight = $('#weight');
    if (weight.val() <= 0 && weight.val() != "") {
        openUpdateFailModal('Weight must be larger than 0.', 'Update Failure');
        weight.focus();
        return
    }
    var drinkingCapacity = $('#drinkingCapacity');
    if (drinkingCapacity.val() < 0 && drinkingCapacity.val() != "") {
        openUpdateFailModal('Drinking capacity must be equal or larger than 0.', 'Update Failure');
        drinkingCapacity.focus();
        return
    }
    var drinkingFrequency = $('#drinkingFrequency');
    if (drinkingFrequency.val() < 0 && drinkingFrequency.val() != "") {
        openUpdateFailModal('Drinking frequency must be equal or larger than 0.', 'Update Failure');
        drinkingFrequency.focus();
        return
    }
    var sleeping = $('#sleeping');
    if ((sleeping.val() < 0 || sleeping.val() > 24) && sleeping.val() != "") {
        openUpdateFailModal('Sleeping hours must be larger than 0 and lower than 24.', 'Update Failure');
        sleeping.focus();
        return
    }
    var exercise = $('#exercise');
    if ((exercise.val() < 0 || exercise.val() > 1440) && exercise.val() != "") {
        openUpdateFailModal('Exercise Time must be larger than 0 and lower than 1440.', 'Update Failure');
        exercise.focus();
        return
    }
    var water = $('#water');
    if (water.val() < 0 && water.val() != "") {
        openUpdateFailModal('Water intake must be larger than 0.', 'Update Failure');
        water.focus();
        return
    }

    //add value
    $('#patientProfileForm input, #patientProfileForm textarea').each(function () {
        var id = $(this).attr('id');
        var value = $(this).val();
        var nowProf = {};

        if (value == undefined || value == null || value == '' || value == ' ') {
            return;
        }

        nowProf['type'] = id;
        if (id == "height") {
            nowProf['value'] = value + ' ' + $('#heightType').val()
        } else if (id == "weight") {
            nowProf['value'] = value + ' ' + $('#weightType').val()
        } else {
            nowProf['value'] = value;
        }

        newProfiles.push(nowProf);

    });
    var smoking = $('#smoking');
    if (smoking.val() != undefined && smoking.val() != null && smoking.val() != "") {
        newProfiles.push({type: 'smoking', 'value': smoking.val()});
    }

    if (newProfiles.length == 0) {
        openModal('No Data in Profiles', 'Profile Update Failure');
        return;
    }

    console.log(newProfiles);

    $.LoadingOverlay('show');
    $.ajax("/api/patient_profile", {
        method: 'POST',
        data: JSON.stringify({
            user_id: user.user_id,
            profiles: newProfiles,
            timestamp: new Date().getTime()
        }),
        dataType: 'json',
        success: function (res) {
            $.LoadingOverlay('hide');
            console.log(JSON.stringify(res));
            if (res['code'] == 'SUCCESS') {
                profiles = newProfiles;
                openUpdatedModal();
            } else {
                openModal(res['msg'], 'Update Failure');
            }
        }
    });
}

function openUpdateFailModal(msg, title) {
    if (title != undefined && title != null && title != '') {
        $('#updateFailedTitle').text(title)
    }
    if (msg == undefined || msg == null || msg == '') {
        msg = 'Updating failed. Please try again.'
    }
    $('#updateFailedModal .modal-body').text(msg);
    $('#updateFailedModal').modal();
}

function openUpdatedModal(msg, title) {
    if (title != undefined && title != null && title != '') {
        $('#updatedTitle').text(title)
    }
    if (msg == undefined || msg == null || msg == '') {
        msg = 'Your profile is successfully updated.'
    }
    $('#updatedModal .modal-body').text(msg);
    $('#updatedModal').modal();
}
