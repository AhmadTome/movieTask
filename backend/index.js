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
        if (/^[\],:{}\s]*$/.test(data.replace(/\\["\\\/bfnrtu]/g, '@').
        replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
        replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

            //the json is ok
            const json = JSON.parse(data);
            if (json['results']) {
               result = json['results'];
                // validation
                result.map((row)=> {
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

                result.map((row) => {

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
                        Plus7AverageCont++;
                    }

                    if (row.hasOwnProperty('vote_average') && row['vote_average'] > 8) {
                        Plus8AverageCont++;
                    }

                    if (row.hasOwnProperty('adult') && row['adult']) {
                        adultMoveCount++;
                    }

                    dataToExcel.push({
                        id: row['id'],
                        title: row['title'],
                        vote_average: row['vote_average'],
                    });
                });


                const workSheetColumnName = [
                    "ID",
                    "Title",
                    "Rating"
                ]
                const workSheetName = 'Rating';
                const filePath = './uploads/' + Date.now() + 'excel.xlsx';
                exportDataToExcel(dataToExcel, workSheetColumnName, workSheetName, filePath);

                let keys = Object.keys(genra_arr_count);
                let count = 0;
                keys.map((key) => {
                    if (genra_arr_count[key] > 1) {
                        count++
                    }
                });


                res.json({
                    Plus7AverageCont: Plus7AverageCont,
                    Plus8AverageCont: Plus8AverageCont,
                    adultMoveCount: adultMoveCount,
                    genra_arr: genra_arr_count,
                    count: count,
                    excelFilePath: filePath,
                });
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
