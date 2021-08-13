'use strict';

const mollieQRCodeModel = '#mollieQrCodeModal';

module.exports = {
    onQRCodeClose: function () {
        $('body').on('hidden.bs.modal', mollieQRCodeModel, function (e) {
            var mollieCancelUrl = $(e.currentTarget).data('mollie-cancel-url');
            $(e.currentTarget).modal('dispose');
            $(e.currentTarget).remove();
            $.spinner().start();
            window.location.href = mollieCancelUrl;
        });
    },
    watchQRCodeStatus: function () {
        var watchInterval;
        $('body').on('shown.bs.modal', mollieQRCodeModel, function (e) {
            var mollieWatchUrl = $(e.currentTarget).data('mollie-watch-url');
            watchInterval = setInterval(function () {
                $.get(mollieWatchUrl, function (data) {
                    if (data.continueUrl) {
                        clearInterval(watchInterval);
                        $.spinner().start();
                        window.location.href = data.continueUrl;
                    }
                });
            }, 2000);
        });

        $('body').on('hidden.bs.modal', mollieQRCodeModel, function () {
            clearInterval(watchInterval);
        });
    }
};
