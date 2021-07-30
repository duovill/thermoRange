ngivr.angular.filter('ngivrDate', function () {
    /**
     * ngivr-date
     * @param input The time string
     * @param timeStamp If the timeStamp string === 'true' it adds hour and minute, if timeStamp string === 'false', it is only year, month, day
     * @param language If the given language is either like 'en', or 'hu', or undefined is the default from 'ngivrSettings.currentTranslation'.
     * @returns {string}
     */
    function ngivrDateFunction(input, timeStamp, language) {
        if (input === undefined || input === null) {
            return '';
        }
        if (timeStamp === true) {
            timeStamp = 'true';
        } else if (timeStamp === false) {
            timeStamp = 'false';
        }
        language = language === undefined ? ngivrSettings.currentTranslation : language;
        moment.locale(language);
        const m = moment(new Date(input));
        if (m.isValid()) {
            if (timeStamp === undefined) {
                timeStamp = false;
            } else {
                timeStamp = timeStamp !== 'false';
            }
            const result = m.format(timeStamp === true ? 'L LTS' : 'L');
            moment.locale(ngivrSettings.currentTranslation);
            return result;
        }
        return ngivr.strings.message.error.invalidDate;
    }

    return ngivrDateFunction;
});
