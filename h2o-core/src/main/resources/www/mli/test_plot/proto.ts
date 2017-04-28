import * as echarts from 'echarts';
function main():void {
    $.ajax({
        type:"POST",
        url:"http://localhost:54321/3/Vis/Stats",
        data: JSON.stringify({ "graphic":
             {"type":"stats",
              "parameters":{"digits":3,"data":true}},
              "data":{"uri":"py_2_sid_a551"}}),
        contentType:"application/json",
        success: function(data) {
            console.log(data)
            var myChart = echarts.init(document.getElementById('main'))
            // specify chart configuration item and data
            var option = {
              title: {
                text: 'ECharts entry example'
              },
              tooltip: {},
                legend: {
                   data:['Sales']
                 },
               xAxis: {
                   data: ["shirt","cardign","chiffon shirt","pants","heels","socks"]
                 },
               yAxis: {},
               series: [{
                  name: 'Sales',
                  type: 'bar',
                  data: [5, 20, 36, 10, 10, 20]
               }]
              };
             myChart.setOption(option);
         }
    })
}

Zepto(main)