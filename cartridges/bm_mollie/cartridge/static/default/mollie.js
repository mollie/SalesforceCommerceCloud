'use strict';

const BM_PREF = '.js-bm-preferences';
const BM_PREF_FORM = '.js-bm-preferences-form';
const BM_PREF_ALERT_SUCCESS = '.js-bm-preferences-alert-success';
const BM_PREF_ALERT_ERROR = '.js-bm-preferences-alert-error';
const BM_PREF_SUBMIT = '.js-bm-preferences-submit';
const BM_PREF_TOGGLE_PASSWORD = '.js-bm-preferences-toggle-password';
const BM_PREF_PASSWORD_FIELD = '.js-bm-preferences-password-field';
const BM_PREF_TEST_API = '.js-bm-preferences-test-api';
const BM_PREF_TEST_API_RESULT = '.js-bm-preferences-test-api-result';

function showSuccess(html) {
    $(BM_PREF_ALERT_SUCCESS).html(html);
    $(BM_PREF_ALERT_SUCCESS).removeClass('d-none');
    $(window).scrollTop(0);
    setTimeout(() => $(BM_PREF_ALERT_SUCCESS).addClass('d-none'), 2000);
}

function showError(html) {
    $(BM_PREF_ALERT_ERROR).html(html);
    $(BM_PREF_ALERT_ERROR).removeClass('d-none');
    $(window).scrollTop(0);
    setTimeout(() => $(BM_PREF_ALERT_ERROR).addClass('d-none'), 2000);
}

function hidePasswordField() {
    $(BM_PREF_PASSWORD_FIELD).attr('type', 'password');
    $(BM_PREF_TOGGLE_PASSWORD).text('Show')
}

function onClickSubmit() {
    $(document).on('click', BM_PREF_SUBMIT, () => {
        // Include unchecked checkboxes in the serialized array
        const formData = $(BM_PREF_FORM).serializeArray();
        $(`${BM_PREF_FORM} input[type="checkbox"]:not(:checked)`).each(function () {
            formData.push({ name: this.name, value: this.checked ? "checked" : "unchecked" });
        });

        $.ajax({
            url: $(BM_PREF_SUBMIT).attr('data-method-url'),
            method: 'POST',
            data: formData,
            success: function (data) {
                if (data.error) {
                    showError('<strong>Error!</strong>');
                } else {
                    showSuccess('<strong>Successfully saved!</strong>');
                    hidePasswordField();
                }
            },
            error: function () {
                showError('<strong>Error!</strong>');
            }
        });
    });
}

function onClickPassword() {
    $(document).on('click', BM_PREF_TOGGLE_PASSWORD, function () {
        const $passwordField = $(this).closest('.input-group').find(BM_PREF_PASSWORD_FIELD);
        if ($passwordField.attr('type') === 'password') {
            $passwordField.attr('type', 'text');
            $(this).text('Hide');
        } else {
            $passwordField.attr('type', 'password');
            $(this).text('Show');
        }
    });
}

function onClickTestApiKeys() {
    $(document).on('click', BM_PREF_TEST_API, function () {
        $.ajax({
            url: $(BM_PREF_TEST_API).attr('data-method-url'),
            data: {
                testApiKey: $(`${BM_PREF_PASSWORD_FIELD}[name="mollieBearerTestToken"]`).val(),
                liveApiKey: $(`${BM_PREF_PASSWORD_FIELD}[name="mollieBearerToken"]`).val()
            },
            method: 'POST',
            success: function (data) {
                $(BM_PREF_TEST_API_RESULT).html(data.resultTemplate);
            },
            error: function () {
                showError('<strong>Error!</strong>');
            }
        });
    });
}

$(document).ready(() => {
    onClickSubmit();
    onClickPassword();
    onClickTestApiKeys();
});
