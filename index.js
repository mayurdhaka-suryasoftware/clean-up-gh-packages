const { Octokit } = require("@octokit/core");
const core = require("@actions/core");
const { Console } = require("console");

// Check if version is not of form v0.0.0 or 0.0.0
function isDeletableVersion(version) {
    var releasePattern = /[v]?[0-9]+\.[0-9]+\.[0-9]+/g;
    var result = version.match(releasePattern);
    if (result != null && result == version) {
        return false
    }
    return true
}

function isOlderThanNumberOfDays(package, noOfDays) {
    const updatedDate = new Date(package.updated_at);
    const today = new Date();
    var time_difference = today.getTime() - updatedDate.getTime();  
    //calculate days difference by dividing total milliseconds in a day  
    var days_difference = time_difference / (1000 * 60 * 60 * 24);  

    if (days_difference > noOfDays) {
        return true
    }
    return false
}

function getPackagesToBeDeleted(packages, noOfDays)  {
    var result = []
    for (var i=0; i < packages.length; i++) {
        if (isDeletableVersion(packages[i].name) && isOlderThanNumberOfDays(packages[i], noOfDays)) {
            result.push(packages[i]);
        }
    }
    return result
}

async function findAndDeletePackageVersions(org, package_type, package_name, noOfDays, token) {
    const octokit = new Octokit({ auth: token });

    // Handle response
    octokit.hook.after("request", async (response, options) => {
        if (response.data.length < 1) {
            console.log(`Package ${package_name} doesn't contain any version.`)
            return
        }
        var packages = getPackagesToBeDeleted(response.data, noOfDays)
        console.log(`packages to be deleted: ${packages}`);
        if (packages.length < 1) {
            console.log(`Package ${package_name} doesn't contain any version older than ${noOfDays} days.`)
            return
        }
        for (var i=0; i < packages.length; i++) {
            deletePackageVersion(org, package_type, package_name, packages[i].name,  packages[i].id, token);
        }
    });

    // Handle error
    octokit.hook.error("request", async (error, options) => {
        core.setFailed(error.message);
    });

    if (org === null || org === "") {
        await octokit.request('GET /user/packages/{package_type}/{package_name}/versions', {
            package_type: package_type,
            package_name: package_name
        });
    } else {
        await octokit.request('GET /orgs/{org}/packages/{package_type}/{package_name}/versions', {
            org: org,
            package_type: package_type,
            package_name: package_name
        });
    }
}

async function deletePackageVersion(org, package_type, package_name, version, version_id, token) {
    const octokit = new Octokit({ auth: token });

    // Handle response
    octokit.hook.after("request", async (response, options) => {
        console.log(`Deleted version ${version} successfully`);
    });

    // Handle error
    octokit.hook.error("request", async (error, options) => {
        if (error != null) {
            console.log(`Unable to delete version ${version}. Error: ${error}`)
            core.setFailed(error);
        }
    });

    if (org === null || org === "") {
        await octokit.request('DELETE /user/packages/{package_type}/{package_name}/versions/{version_id}', {
            package_type: package_type,
            package_name: package_name,
            version_id: version_id
        });
    } else {
        await octokit.request('DELETE /orgs/{org}/packages/{package_type}/{package_name}/versions/{version_id}', {
            org: org,
            package_type: package_type,
            package_name: package_name,
            version_id: version_id
        });
    }
}

async function run() {
    const org = core.getInput("ORG");
    const package_type = core.getInput("PACKAGE_TYPE");
    const package_name = core.getInput("PACKAGE_NAME");
    const token = core.getInput("TOKEN");
    const noOfDays = core.getInput("OLDER_THAN_NUMBER_OF_DAYS");

    if (!Number.isInteger(noOfDays)) {
        core.setFailed(`noOfDays ${noOfDays} should be a valid integer`)
    }
    if (noOfDays < 1) {
        core.setFailed(`noOfDays ${noOfDays} cannot be less than 1`)
    }

    findAndDeletePackageVersions(org, package_type, package_name, noOfDays, token);
}

run();
