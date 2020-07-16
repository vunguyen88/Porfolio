// const isEmpty = (string) => {
//     if(string.trim() == '') return true;
//     else return false;
// }

const isEmpty = (string) => {
    (string == '') ? true : false
} 

const isEmail = (email) => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.match(regEx)) return true;
    else return false;
}

exports.validateSignupData = (data) => {
    let errors = {};

    if(isEmpty(data.email)) {
        errors.email = 'Must not be empty'
    } else if(!isEmail(data.email)) {
        errors.email = 'Must be a valid email address'
    }

    if(isEmpty(data.firstName)) errors.firstName = 'Must not be empty';
    if(isEmpty(data.lastName)) errors.lastName = 'Must not be empty';
    if(isEmpty(data.password)) errors.password = 'Must not be empty';
    //if(isEmpty(data.employeeId)) errors.employeeId = 'Must not be empty';
    //if(isEmpty(data.role)) errors.role = 'Must not be empty';

    return {errors, valid: Object.keys(errors).length === 0 ? true : false}
}

exports.validateLoginData = (data) => {
    let errors = {};

    if(isEmpty(data.email)) {
        errors.email = 'must not be empty'
    } else if (!isEmail(data.email)) {
        errors.email = 'must be a valid email'
    }

    if(isEmpty(data.password)) {
        errors.password = 'must not be empty'
    }

    return {
        errors, valid: Object.keys(errors).length === 0 ? true : false
    }
}

exports.reduceJobDetails = (data) => {
    let jobDetails = {};
    if(!isEmpty(data.name.trim())) jobDetails.name = data.name;
    if(!isEmpty(data.description.trim())) jobDetails.description = data.description;

    return jobDetails;
}