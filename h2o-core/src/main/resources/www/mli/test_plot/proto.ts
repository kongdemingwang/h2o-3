namespace ModelInterpretability {
    function plot_klime(frame_key: string) {
        $.ajax({
            type: "POST",
            url: "/3/Vis/Stats",
            data: JSON.stringify({
                "graphic":
                {
                    "type": "stats",
                    "parameters": { "digits": 3, "data": true }
                },
                "data": { "uri": frame_key }
            }),
            contentType: "application/json",
            success:  (data) => {
                console.log(data)
                // plot by klime cluster
                // click / select id value, generate cluster, permanent pinned row for that query
                const myChart = ECharts.init(<HTMLDivElement>document.getElementById('main'))
                const option = {
                    title: {
                        text: 'KLime Test'
                    },
                    tooltip: {
                        trigger: 'axis'
                    },
                    legend: {
                        data: ['model predictions', 'klime predictions']
                    },
                    xAxis: { data: data.columns[data.column_names.indexOf("idx")] },
                    yAxis: { min: -0.1 },
                    series: [{
                        name: 'model_pred',
                        type: 'line',
                        data: data.columns[data.column_names.indexOf("model_pred")]
                    },
                    {
                        name: 'klime_pred',
                        type: 'line',
                        data: data.columns[data.column_names.indexOf("predict_klime")]
                    }
                    ].concat(data.column_names.map(function (x: string) {
                        if (x.match('^rc_')) {
                            return {
                                name: x,
                                type: 'line',
                                data: data.columns[data.column_names.indexOf(x)],
                                showSymbol: false,
                                symbolSize: 0,
                                hoverAnimation: false,
                                lineStyle: { normal: { width: 0 } }
                            }
                        }
                    })).filter(x => x)
                };
                myChart.setOption(option);

            }
        })
    }
    export function main(): void {
        const params = new URLSearchParams(document.location.search)
        const interpret_key = params.get("interpret_key")
        $.get("/3/InterpretModel/" + interpret_key,
            function (data) {
                var frame_id = data.interpret_id.name
                console.log(frame_id)
                plot_klime(frame_id)
            }
        )
    }
}

Zepto(ModelInterpretability.main)