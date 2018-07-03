const fs = require('fs')
const cheerio = require("cheerio"), tinreq = require("tinyreq");
const xml2js = require('xml2js');
const fetch = require('node-fetch');
const { request } = require('graphql-request');
const graphQlUrl = {
    'stage': 'https://stage.economist.com/graphql',
    'prod': 'https://www.economist.com/graphql'
}


class utility {
    constructor() {
    }
    getDataFromUrl(url, callback) {
        return this.scrapeData("https://www.economist.com/", {
            title: ".sections-card__list"
        }, (err, data) => {
            callback(this.getlinkHref(data))
        })
    }
    scrapeData(url, data, cb) {
        tinreq(url, (err, body) => {
            if (err) { return cb(err); }
            let $ = cheerio.load(body), pageData = {};
            Object.keys(data).forEach(k => {
                pageData[k] = $(data[k]).html();
            });
            cb(null, pageData);
        });
    }

    getlinkHref(data) {
        let returndata = [];
        if (data) {
            data.title.split("</li>").map((item, index) => {
                if (item.match(/href="([^"]*")/)) {
                    let href = item.match(/href="([^"]*")/)[1].replace('/sections', '').replace('/', '').replace('\"', '');
                    let topicName = item.match(/\>(.*?)\</g)[1].replace('>', '').replace('<', '');
                    returndata.push({ key: topicName, value: href })
                }
            })
        }
        return returndata;
    }

    getDataFromXml(size) {
        let returnData = { item: [] }

        return fetch('https://acast.azure-api.net/rssEconomist/theeconomisttastingmenu?subscription-key=d67d08ad7d2f4843835cf50c3f280890')
            .then(res => res.text())
            .then(body => {
                console.log(body)
                let parser = new xml2js.Parser();
                parser.parseString(body, function (err, result) {
                    result.rss.channel[0].item.map((item, index) => {
                        if (index < size) {
                            console.log(JSON.stringify(item.description))
                            console.log(index + "--" + size)
                            returnData.item.push({ id: index, title: item.title[0], enclosure: item.enclosure[0].$.url, desc: item.description[0].replace(/<p>|<\/p>/g, '') })
                        }
                    })
                });
                return returnData;
            })
    }

    getDataByTopics(size, topic) {
        let returnData = {
            item: []
        }
        return this.getDataFromGraphQLEconomist(topic).then(res => {
            if (res) {
                //console.log("RES-----" + res + "-----" + topic + "-----" + "------" + size)
                console.log("RES-----" + res.status + "----");
                if (res.response) {
                    let count = 0;
                    res.response.data.canonical.hasPart.parts.map((item, index) => {
                        if (item.audio) {
                            if (item.audio.main) {
                                if (item.audio.main.url.canonical) {
                                    if (count < size) {
                                        count++;
                                        returnData.item.push({ id: count, tegID: item.tegID, audio: item.audio.main.url.canonical, title: item.title, published: item.published })

                                    }

                                }
                            }
                        }

                    })
                } else {
                    let count2 = 0;
                    res.canonical.hasPart.parts.map((item, index) => {
                        if (item.audio) {
                            if (item.audio.main) {
                                if (count2 < size) {
                                    count2++;
                                    returnData.item.push({ id: index, tegID: item.tegID, audio: item.audio.main.url.canonical, title: item.title, published: item.published })
                                }
                            }
                        }
                    })
                }

            }
            return returnData;
        })
    }

    getDataFromGraphQLEconomist(topic) {
        // TODO: Change URL per enviorment and size too.
        let url = graphQlUrl.stage;
        let size = 50;
        const query = `{
      canonical(ref: "/xref/stage.economist.com/sections/${topic}") {
        hasPart (size:${size}){
      parts {
        tegID
        audio {
          main {
            id
            url {
              canonical
            }
          }
        }
        title: headline
        published: datePublished
        lastModified: dateModified
        print {
          section {
            id
            tegID
            sectionName: headline
          }
        }
      }
    }
      }
    }`;

        var dataWithPromise = request(url, query).then(response => {
            console.log("--------graphQlUrlgraphQlUrlgraphQlUrl----", JSON.stringify(response), "--query--", query);
            return response;
        }).catch(error => {
            console.log("--------errorerrorerrorerrorerrorerrorerror----", JSON.stringify(error.response), "--query--", query);
            return error;
        });
        return dataWithPromise
    }

}
module.exports = utility;