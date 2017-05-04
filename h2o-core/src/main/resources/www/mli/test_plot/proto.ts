import * as echarts from 'echarts';

function main():void {
    $.ajax({
        type:"POST",
        url:"http://localhost:54321/3/Vis/Stats",
        data: JSON.stringify({ "graphic":
             {"type":"stats",
              "parameters":{"digits":3,"data":true}},
              "data":{"uri":"py_19_sid_93bd"}}),
        contentType:"application/json",
        success: function(data) {
            console.log(data)
            // plot by klime cluster
            // click / select id value, generate cluster, permanent pinned row for that query
            var myChart = echarts.init(<HTMLDivElement>document.getElementById('main'))
            var option = {
                title: {
                    text: 'KLime Test'
                },
                tooltip: {
                    trigger: 'axis'
                },
                legend: {
                    data: ['model predictions', 'klime predictions']
                },
                xAxis: {data: data.columns[data.column_names.indexOf("idx")]},
                yAxis: {min:-0.1},
                series: [{
                        name: 'model_pred',
                        type: 'line',
                        data: data.columns[data.column_names.indexOf("p1")] 
                    },
                    {
                        name: 'klime_pred',
                        type: 'line',
                        data: data.columns[data.column_names.indexOf("predict_klime")]
                    }
                    ].concat(data.column_names.map(function(x:string) {
                        if(x.match('^rc_')) {
                           return  {
                            name: x,
                            type: 'line',
                            data: data.columns[data.column_names.indexOf(x)],
                            showSymbol: false,
                            symbolSize: 0,
                            hoverAnimation:false,
                            lineStyle: {normal:{width:0}}
                            } 
                        } 
                    })).filter(x=>x)
            };
             myChart.setOption(option);
             
         }
    })
}

Zepto(main)