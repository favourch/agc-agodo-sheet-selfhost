const express = require('express');
const utils = require('./utils'); // Make sure utils has getUrlQueryParams method that parses query parameters from the URL
const axios = require('axios'); // Using axios for HTTP requests
const { performance } = require('perf_hooks');
const { parse } = require('csv-parse/sync');

const app = express();
const port = process.env.PORT || 3000;

class Performance {
    constructor(name = 'Unnamed Task') {
        this.startTime = performance.now();
        this.name = name;
    }

    getElapsed() {
        return performance.now() - this.startTime;
    }

    log() {
        console.log(`${this.name} took ${this.getElapsed()}ms to complete`);
    }
}

// Serving static files from the 'public' directory
app.use(express.static("public"));

// Setup CORS to allow all origins
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});


// Route to download data from Google Sheets
// app.get('/dl', async (req, res) => {
//     let queryParams = utils.getUrlQueryParams(req.url);
//     if (!queryParams || Object.keys(queryParams).length === 0) {
//         return res.status(400).send("Bad request: No arguments supplied");
//     }

//     const { id, sheetName } = queryParams;
//     if (id && sheetName) {
//         // const getUrl = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&headers=1&sheet=${sheetName}`;
//         const getUrl = `https://docs.google.com/spreadsheets/d/1xn9OXGMe5o7cGj7X4VN0yl-YIxPv1wYT_cyvY-kpE_U/gviz/tq?tqx=out:csv&headers=1&sheet=${sheetName}`;
//         console.log(getUrl);

//         let p = new Performance('Download Google Sheet');
//         try {
//             const response = await axios.get(getUrl);
//             p.log(); // Log the performance metric
//             res.status(200).send({
//                 status: "OK",
//                 text: response.data,
//                 time: p.getElapsed()
//             });
//         } catch (error) {
//             res.status(500).send({
//                 status: "DownloadFailed",
//                 text: error.response ? error.response.data : 'No response body',
//                 responseCode: error.response ? error.response.status : 'No response status',
//                 message: error.response ? error.response.statusText : 'No response status text',
//                 reqUrl: getUrl
//             });
//         }
//     } else {
//         let missingParams = [];
//         if (!id) missingParams.push("id");
//         if (!sheetName) missingParams.push("sheetName");

//         res.status(400).send({
//             status: "QueryStringMissingParams",
//             missing: missingParams.join(", "),
//             reqUrl: req.url
//         });
//     }
// });

// Modify the /dl endpoint
// app.get('/dl', async (req, res) => {
//     let queryParams = utils.getUrlQueryParams(req.url);
//     if (!queryParams || Object.keys(queryParams).length === 0) {
//         return res.status(400).send("Bad request: No arguments supplied");
//     }

//     const { id, sheetName } = queryParams;
//     if (id && sheetName) {
//         const getUrl = `https://docs.google.com/spreadsheets/d/1xn9OXGMe5o7cGj7X4VN0yl-YIxPv1wYT_cyvY-kpE_U/gviz/tq?tqx=out:csv&headers=1&sheet=${sheetName}`;
//         console.log(getUrl);

//         let p = new Performance('Download Google Sheet');
//         try {
//             const response = await axios.get(getUrl);
//             p.log(); // Log the performance metric

//             // Parse CSV to JSON
//             const records = parse(response.data, {
//                 columns: true,  // Use first row as header names
//                 skip_empty_lines: true
//             });

//             res.status(200).json(records); // Send JSON formatted records
//         } catch (error) {
//             res.status(500).send({
//                 status: "DownloadFailed",
//                 text: error.response ? error.response.data : 'No response body',
//                 responseCode: error.response ? error.response.status : 'No response status',
//                 message: error.response ? error.response.statusText : 'No response status text',
//                 reqUrl: getUrl
//             });
//         }
//     } else {
//         let missingParams = [];
//         if (!id) missingParams.push("id");
//         if (!sheetName) missingParams.push("sheetName");

//         res.status(400).send({
//             status: "QueryStringMissingParams",
//             missing: missingParams.join(", "),
//             reqUrl: req.url
//         });
//     }
// });

app.get('/dl', async (req, res) => {
    let queryParams = utils.getUrlQueryParams(req.url);
    if (!queryParams || Object.keys(queryParams).length === 0) {
        return res.status(400).send("Bad request: No arguments supplied");
    }

    const { id, sheetName, columns } = queryParams;
    if (id && sheetName) {
        const getUrl = `https://docs.google.com/spreadsheets/d/1xn9OXGMe5o7cGj7X4VN0yl-YIxPv1wYT_cyvY-kpE_U/gviz/tq?tqx=out:csv&headers=1&sheet=${sheetName}`;
        console.log(getUrl);

        let p = new Performance('Download Google Sheet');
        try {
            const response = await axios.get(getUrl);
            p.log(); // Log the performance metric

            // Parse CSV to JSON
            const records = parse(response.data, {
                columns: true,  // Use first row as header names
                skip_empty_lines: true
            });

            // Filter columns if 'columns' query param is provided
            if (columns) {
                const selectedColumns = columns.split(',');
                const filteredRecords = records.map(record => {
                    const filteredRecord = {};
                    selectedColumns.forEach(column => {
                        if (record.hasOwnProperty(column)) {
                            filteredRecord[column] = record[column];
                        }
                    });
                    return filteredRecord;
                });
                res.status(200).json(filteredRecords);
            } else {
                res.status(200).json(records);
            }
        } catch (error) {
            res.status(500).send({
                status: "DownloadFailed",
                text: error.response ? error.response.data : 'No response body',
                responseCode: error.response ? error.response.status : 'No response status',
                message: error.response ? error.response.statusText : 'No response status text',
                reqUrl: getUrl
            });
        }
    } else {
        let missingParams = [];
        if (!id) missingParams.push("id");
        if (!sheetName) missingParams.push("sheetName");

        res.status(400).send({
            status: "QueryStringMissingParams",
            missing: missingParams.join(", "),
            reqUrl: req.url
        });
    }
});


// Start the server
app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
});
