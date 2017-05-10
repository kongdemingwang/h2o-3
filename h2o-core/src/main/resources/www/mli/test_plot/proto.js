var ModelInterpretability;
(function (ModelInterpretability) {
    function plot_klime(frame_key) {
        $.ajax({
            type: "POST",
            url: "http://localhost:54321/3/Vis/Stats",
            data: JSON.stringify({
                "graphic": {
                    "type": "stats",
                    "parameters": { "digits": 3, "data": true }
                },
                "data": { "uri": frame_key }
            }),
            contentType: "application/json",
            success: function (data) {
                console.log(data);
                // plot by klime cluster
                // click / select id value, generate cluster, permanent pinned row for that query
                var myChart = echarts.init(document.getElementById('main'));
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
                    xAxis: { data: data.columns[data.column_names.indexOf("idx")],
                             axisLabel: {show: false} },
                    yAxis: { min: -0.1 },
                    series: [{
                            name: 'model_pred',
                            type: 'line',
                            data: data.columns[data.column_names.indexOf("model_pred")],
                            lineStyle: { normal: { width: 0}},
                            showAllSymbol: true,
                            symbolSize:1
                        },
                        {
                            name: 'klime_pred',
                            type: 'line',
                            data: data.columns[data.column_names.indexOf("predict_klime")],
                            lineStyle: { normal: { width: 0}},
                            showAllSymbol: true,
                            symbolSize:1
                        }
                    ].concat(data.column_names.map(function (x) {
                        if (x.match('^rc_')) {
                            return {
                                name: x,
                                type: 'line',
                                data: data.columns[data.column_names.indexOf(x)],
                                showSymbol: false,
                                symbolSize: 0,
                                hoverAnimation: false,
                                lineStyle: { normal: { width: 0 } }
                            };
                        }
                    })).filter(function (x) { return x; })
                };
                myChart.setOption(option);
            }
        });
    }
    function main() {
        var params = new URLSearchParams(document.location.search);
        var interpret_key = params.get("interpret_key");
        $.get("http://localhost:54321/3/InterpretModel/" + interpret_key, function (data) {
            var frame_id = data.interpret_id.name;
            console.log(frame_id);
            plot_klime(frame_id);
        });
    }
    ModelInterpretability.main = main;
})(ModelInterpretability || (ModelInterpretability = {}));
Zepto(ModelInterpretability.main);
