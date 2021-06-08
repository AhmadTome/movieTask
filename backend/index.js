import express from 'express';
import multer from 'multer';
import bodyParser from 'body-parser';
import fs from 'fs';
import exportDataToExcel from './exportService.js';
import cors from 'cors';

const app = express();

const fileStorageEngin = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads")
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + ' -- ' + file.originalname)
    },
});

const upload = multer({storage: fileStorageEngin});

app.use(bodyParser.urlencoded({extended: false}));
app.use(cors());

app.post('/movies', upload.single('file'), function (req, res) {

    fs.readFile(req.file.path, 'utf-8', function (error, data) {
        let flag = true;
        let result;
        const regex = new RegExp("^[\\],:{}\\s]*$");
        const filteredData = data.replace(/\\["\\\/bfnrtu]/g, '@').
        replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
        replace(/(?:^|:|,)(?:\s*\[)+/g, '');

        if (regex.test(filteredData)) {
            //the json is ok
            const fileDataExtracted = JSON.parse(data);
            if (fileDataExtracted['results']) {
               result = fileDataExtracted['results'];
                // validation
                var isNotValid = result.some((row)=> {
                    return !row.hasOwnProperty('genre_ids')
                        || !row.hasOwnProperty('vote_average')
                        || !row.hasOwnProperty('adult')
                        || !row.hasOwnProperty('id')
                        || !row.hasOwnProperty('title')
                });

                if (isNotValid) {
                    res.json({
                        Plus7AverageCont: 0,
                        Plus8AverageCont: 0,
                        adultMoveCount: 0,
                        count: 0,
                        excelFilePath: "noPath",
                    });
                }



                let genra_arr_count = {};

                let resultJson = result.reduce((acc, row) => {
                    if (row.hasOwnProperty('genre_ids')) {
                        let genra_arr = row['genre_ids'];
                        genra_arr.forEach((id) => {
                            if (genra_arr_count[id]) {
                                let val = genra_arr_count[id];
                                genra_arr_count[id] = val + 1;
                            } else {
                                genra_arr_count[id] = 1;
                            }
                        });
                    }

                    let moviesProperties = {};

                    if (row.hasOwnProperty('vote_average') && row['vote_average'] > 7) {
                        moviesProperties.Plus7AverageCont = acc['Plus7AverageCont']++;
                    }

                    if (row.hasOwnProperty('vote_average') && row['vote_average'] > 8) {
                        moviesProperties.Plus8AverageCont = acc['Plus8AverageCont']++;
                    }

                    if (row.hasOwnProperty('adult') && row['adult']) {
                        moviesProperties.adultMoveCount = acc['adultMoveCount']++;
                    }

                    moviesProperties.dataToExcel = acc['dataToExcel'].push({id: row['id'], title: row['title'], vote_average: row['vote_average']});

                    return {moviesProperties, ...acc};


                }, {
                    Plus7AverageCont: 0,
                    Plus8AverageCont: 0,
                    adultMoveCount: 0,
                    genra_arr: genra_arr_count,
                    count: 0,
                    excelFilePath: "",
                    dataToExcel: [],
                })

                const workSheetColumnName = [
                    "ID",
                    "Title",
                    "Rating"
                ]
                const workSheetName = 'Rating';
                const filePath = './uploads/' + Date.now() + 'excel.xlsx';
                exportDataToExcel(resultJson.dataToExcel, workSheetColumnName, workSheetName, filePath);
                resultJson.excelFilePath = filePath;

                let keys = Object.keys(genra_arr_count);
                keys.forEach((key) => {
                    if (genra_arr_count[key] > 1) {
                         resultJson.count++;
                    }
                });

                res.json(resultJson);
            } else {
                flag = false;
            }
        }else{
            //the json is not ok
            flag = false;
        }

        if (!flag) {
            res.json({
                Plus7AverageCont: 0,
                Plus8AverageCont: 0,
                adultMoveCount: 0,
                count: 0,
                excelFilePath: "noPath",
            });
        }
    })


});


app.listen(8080, () => console.log('start listing on port 8080 ...'));
