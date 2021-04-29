$(document).ready(function () {
    $('#uploadFile').on('click', function () {

        if ($('#file').prop('files').length == 0) {
            alert('Please select file before submitting!');
            return false;
        }

        var fileExtension = ['txt'];
        if ($.inArray(($('#file').prop('files')[0].name).split('.').pop().toLowerCase(), fileExtension) == -1) {
            alert("Only .txt formats are allowed");
            return false;
        }

        var file_data = $('#file').prop('files')[0];
        var form_data = new FormData();
        form_data.append('file', file_data);
        $.ajax({
           url: 'http://localhost:8080/movies',
           dataType: 'text',
           cache: false,
           contentType: false,
           processData: false,
           data: form_data,
           type: 'post',
           success: function(result){
               result = JSON.parse(result);
                $('#adultMoveCount').text(result['adultMoveCount']);
                $('#Plus7AverageCont').text(result['Plus7AverageCont']);
                $('#Plus8AverageCont').text(result['Plus8AverageCont']);
                $('#count').text(result['count']);


               $('#downloadCsvContent').empty();
               if (result['excelFilePath'] != "noPath") {
                   $('#downloadCsvContent').append('' +
                       '<h2>Your Csv File is ready, <a href="backend/'+ result['excelFilePath'] +'">click here</a> to download </h2>'
                   );
               }

           },
            error: function (err) {
               console.log(err)
            }
        });



    });
});
