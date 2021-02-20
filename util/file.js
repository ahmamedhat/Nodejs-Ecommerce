const fs = require('fs');

const deletFile = (filePath) => {
    if (fs.existsSync()) {
        fs.unlink(filePath , (err) => {
            if(err) {
                throw (err);
            }
        });
    }
}

exports.deletFile = deletFile;