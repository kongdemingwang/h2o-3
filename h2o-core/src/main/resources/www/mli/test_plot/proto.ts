namespace ModelInterpretability {
    function plot_klime(frame_key: string) {
        $.ajax({
            type: "POST",
            url: "http://localhost:54321/3/Vis/Stats",
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
                        text: 'Global KLime Plot',
                        left: 'center'
                    },
                    tooltip: {
                        trigger: 'axis'
                    },
                    legend: {
                        data: ['Model Prediction', 'KLime Model Prediction'],
                        top:20
                    },
                    xAxis: { data: data.columns[data.column_names.indexOf("idx")],
                             axisLabel: {show: false} },
                    yAxis: { },
                    series: [{
                        name: 'Model Prediction',
                        type: 'line',
                        data: data.columns[data.column_names.indexOf("model_pred")],
                        lineStyle: { normal: { width: 0}},
                        showAllSymbol: true,
                        symbolSize:1
                    },
                    {
                        name: 'KLime Model Prediction',
                        type: 'line',
                        data: data.columns[data.column_names.indexOf("predict_klime")],
                        lineStyle: { normal: { width: 0}},
                        showAllSymbol: true,
                        symbolSize:1
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

    function loadPlot() {
      $('#main').css('height',window.innerHeight).css('width',window.innerWidth)
        const params = new URLSearchParams(document.location.search)
        const interpret_key = params.get("interpret_key")
        $.get("http://localhost:54321/3/InterpretModel/" + interpret_key,
            (data) => {
                var agg_frame_id = data.interpret_id.name
                console.log(agg_frame_id)
                plot_klime(agg_frame_id)
                loadSearchBar(data.frame_id.name)
            }
        )
    }
    function loadSearchBar(frame_id:string) {
        $.get("http://localhost:54321/3/Frames/" + frame_id + "/columns",
            (data) => {
                const columns = data.frames[0].columns.filter((col:any) => ["int","enum"].indexOf(col.type) > 0 )
                const labels = columns.map((x:any)=>x.label)
                console.log(labels)
                for (let e of labels) {
                    $('<option>').val(e).text(e).appendTo($('#columns'))                
                }
            }
        )
    }
    function loadClusterPlot(e:Event) {
        console.log(e)
        loadPlot()
    }
    export function main(): void {
        loadPlot()
        window.onresize = _.debounce(loadPlot, 500)
        $(document).on('click', '#search-trigger', function (e) { loadClusterPlot(e); return true; })
    }
}

Zepto(ModelInterpretability.main)