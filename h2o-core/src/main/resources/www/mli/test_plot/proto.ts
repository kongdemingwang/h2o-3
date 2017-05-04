import * as echarts from 'echarts';
function plot_klime(frame_key:string) {
    $.ajax({
        type:"POST",
        url:"http://localhost:54321/3/Vis/Stats",
        data: JSON.stringify({ "graphic":
             {"type":"stats",
              "parameters":{"digits":3,"data":true}},
              "data":{"uri":frame_key}}),
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
function main():void {
    var params = new URLSearchParams(document.location.search) 
    var interpret_key = params.get("interpret_key")
    $.get("http://localhost:54321/3/InterpretModel/"+interpret_key,
       function(data) {
           var frame_id = data.frame_id.name
           console.log(frame_id)
           plot_klime(frame_id)
       }
    )
}

Zepto(main)