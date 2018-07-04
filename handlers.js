const fs = require('fs')
const util = require('./utility');
let returnData = {
    item: []
}

const responses = {
    success: (data = {}, code = 200) => {
        return {
            'statusCode': code,
            'body': JSON.stringify(data)
        }
    },
    error: (error) => {
        return {
            'statusCode': error.code || 500,
            'body': JSON.stringify(error)
        }
    }
}


exports.handler = (event, context, callback) => {
    
    let _util = new util;
    switch (event.field) {
        case "getAllDataFromXMLRSS":
            _util.getDataFromXml(event.arguments.size).then(data => {
                console.log('=> Promise data: ', JSON.stringify(data));
                callback(null, data.item);
            }).catch(error => {
                console.log('=> Error in Promise :', error);
            })

        case "getDataByTopics":
            _util.getDataByTopics(event.arguments.size, event.arguments.tegID).then(data => {
                console.log('=> Promise data: ', JSON.stringify(data));
                callback(null, data.item);
            }).catch(error => {
                console.log('=> Error in Promise :', error);
            })
        case "getMainTopics":
            _util.getDataForMainTopic("event.arguments.url", function (data) {
                console.log({ "data": data })
                if (event.field == 'getMainTopics') {
                    callback(null, { "data": data })
                } else {
                    callback(null, responses.success(data))
                }

            });
    }
};