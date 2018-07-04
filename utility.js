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
    getDataForMainTopic() {
        let returnData = {
            item: []
        }

        return this.getTopicQuery()
            .then(res => {
                if (res) {
                    res.data.canonical.hasPart.parts.map((item, index) => {
                        returnData.item.push({ id: index, tegId: item.tegID, headline: item.headline, can: item.url.canonical })
                    })
                }


                if (res) {
                    //console.log("RES-----" + res + "-----" + topic + "-----" + "------" + size)
                    console.log("RES-----" + res.status + "----");
                    if (res.response) {
                        let count = 0;
                        res.response.data.canonical.hasPart.parts.map((item, index) => {
                            if (item.tegID) {

                                if (count < size) {
                                    count++;
                                    returnData.item.push({ id: index, tegId: item.tegID, headline: item.headline, can: item.url.canonical })

                                }

                            }

                        })
                    } else {
                        let count2 = 0;
                        res.canonical.hasPart.parts.map((item, index) => {
                            if (item.tegID) {
                                if (count2 < size) {
                                    count2++;
                                    returnData.item.push({ id: index, tegId: item.tegID, headline: item.headline, can: item.url.canonical })
                                }
                            }
                        })
                    }

                }
                return returnData;
            })
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
        return this.getDataFromGraphQLEconomist(tegID).then(res => {
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
                                        returnData.item.push({ id: count, tegID: item.tegID, audio: item.audio.main.url.canonical })

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
                                    returnData.item.push({ id: index, tegID: item.tegID, audio: item.audio.main.url.canonical })
                                }
                            }
                        }
                    })
                }

            }
            return returnData;
        })
    }
    getTopicQuery() {
        let url = graphQlUrl.stage;
        let size = 50;
        const query = `{
            canonical(ref: "/xref/stage.economist.com/topics") {
              tegID
              headline
              hasPart{
                parts{
                  tegID
                  headline
                  url {
                    canonical
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
    getDataFromGraphQLEconomist(tegID) {
        // TODO: Change URL per enviorment and size too.
        let url = graphQlUrl.stage;
        let size = 50;
        const query = `{
            canonical(ref: "/content/${tegID}") {
              title: headline
              published: datePublished
              lastModified: dateModified
              hasPart(size: 50) {
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