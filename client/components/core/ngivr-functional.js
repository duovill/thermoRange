ngivr.functional = new function () {
    this.once = (func) => {
        const executer = function () {
            if (executer.hasOwnProperty('$ngivrFunctionalId')) {
                delete executer['$ngivrFunctionalId']
                func();
            } else {
                // this could be test if it works
                //ngivr.growl('this function was executed more then once!')
            }
        }
        executer.$ngivrFunctionalId = ngivr.nextId();
        return executer;
    }
}
