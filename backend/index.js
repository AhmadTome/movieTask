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
                result.some((row)=> {
                    if (!row.hasOwnProperty('genre_ids')
                        || !row.hasOwnProperty('vote_average')
                        || !row.hasOwnProperty('adult')
                        || !row.hasOwnProperty('id')
                        || !row.hasOwnProperty('title')
                    ) {
                        res.json({
                            Plus7AverageCont: 0,
                            Plus8AverageCont: 0,
                            adultMoveCount: 0,
                            count: 0,
                            excelFilePath: "noPath",
                        });
                    }
                });


                let Plus8AverageCont = 0;
                let Plus7AverageCont = 0;
                let adultMoveCount = 0;
                let genra_arr_count = {};
                let dataToExcel = [];



                let resultJson = result.reduce((acc, row) => {
                    if (row.hasOwnProperty('genre_ids')) {
                        let genra_arr = row['genre_ids'];
                        genra_arr.map((id) => {
                            if (genra_arr_count[id]) {
                                let val = genra_arr_count[id];
                                genra_arr_count[id] = val + 1;
                            } else {
                                genra_arr_count[id] = 1;
                            }
                        });
                    }

                    if (row.hasOwnProperty('vote_average') && row['vote_average'] > 7) {
                        acc['Plus7AverageCont'] = acc['Plus7AverageCont'] +1;
                    }

                    if (row.hasOwnProperty('vote_average') && row['vote_average'] > 8) {
                        acc['Plus8AverageCont'] = acc['Plus8AverageCont'] +1;
                    }

                    if (row.hasOwnProperty('adult') && row['adult']) {
                        acc['adultMoveCount'] = acc['adultMoveCount'] +1;
                    }

                    dataToExcel.push({
                        id: row['id'],
                        title: row['title'],
                        vote_average: row['vote_average'],
                    });
                    return acc;


                }, {
                    Plus7AverageCont: 0,
                    Plus8AverageCont: 0,
                    adultMoveCount: 0,
                    genra_arr: genra_arr_count,
                    count: 0,
                    excelFilePath: "",
                })




                const workSheetColumnName = [
                    "ID",
                    "Title",
                    "Rating"
                ]
                const workSheetName = 'Rating';
                const filePath = './uploads/' + Date.now() + 'excel.xlsx';
                exportDataToExcel(dataToExcel, workSheetColumnName, workSheetName, filePath);
                resultJson.excelFilePath = filePath;

                let keys = Object.keys(genra_arr_count);
                let count = keys.reduce((count, key) => {
                    if (genra_arr_count[key] > 1) {
                       // console.log(genra_arr_count[key]);
                        return resultJson.count++;
                    }
                    return 0;
                }, 0);

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
