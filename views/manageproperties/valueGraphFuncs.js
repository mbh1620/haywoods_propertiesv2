var ctx = document.getElementById('myChart').getContext('2d');
    var ctxrent = document.getElementById('myRentChart').getContext('2d');
    var chart = new Chart(ctx, {
      // The type of chart we want to create
      type: 'line',

      // The data for our dataset
      data: {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        datasets: [{
          fill: false,
          label: 'House price',
          lineTension: 0,
          backgroundColor: 'rgb(255, 99, 132)',
          borderColor: 'rgb(255, 99, 132)',
          data: []
          }]
        },

    // Configuration options go here
    options: {
    }
      });
      
  //===========================================
  //       Function for value graph
  //===========================================
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var yearSelectPortfolio = $("#yearselect").val();
  var correctYear = [];
  console.log($("#yearselect").val());
  console.log("val");
  for (var i = 0; i < estimatedValueData.length; i++) {
    if (estimatedValueData[i].year === 2020) {
      //Append to the graph data array
      correctYear.push(estimatedValueData[i]);
      //console.log(portfoliodata[i].year + " = 2020");
      //Sort data into correct months
      //Go down the months list and check for data and append
    }
  }
  for (var j = 0; j < months.length; j++) {
    var flag = false;
    for (var k = 0; k < correctYear.length; k++) {
      //Search for January, if not present then value = null 
      flag = false;
      if (months[j] === correctYear[k].month) {
        chart.data.datasets[0].data.push(correctYear[k].value);
        break;
      } else {
        flag = true;
      }
    }
    if (flag === true) {
      chart.data.datasets[0].data.push(null);
    }
  }
  chart.update();

  //===========================================
  //  Function for value graph when changing year selector
  //===========================================

  $('#yearselect').on("change", function(){
    //This function is to change the year displayed on the value graph

    //First clear the data array for graph
    chart.data.datasets[0].data = [];
    //Populate with correct year data
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var yearSelectPortfolio = $("#yearselect").val();
    var correctYear = [];
    for (var i = 0; i < estimatedValueData.length; i++) {
      if (estimatedValueData[i].year == yearSelectPortfolio) {
        //Append to the graph data array
        correctYear.push(estimatedValueData[i]);
        //console.log(portfoliodata[i].year + " = 2020");
        //Sort data into correct months
        //Go down the months list and check for data and append
      }
    }
    console.log(correctYear);
    for (var j = 0; j < months.length; j++) {
      var flag = false;
      for (var k = 0; k < correctYear.length; k++) {
        //Search for January, if not present then value = null 
        flag = false;
        if (months[j] === correctYear[k].month) {
          chart.data.datasets[0].data.push(correctYear[k].value);
          break;
        } else {
          flag = true;
        }
      }
      if (flag === true) {
        chart.data.datasets[0].data.push(null);
      }
    }
    chart.update();
  })