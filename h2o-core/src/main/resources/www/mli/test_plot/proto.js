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
                        text: 'Global KLime Plot',
                        left: 'center'
                    },
                    tooltip: {
                        trigger: 'axis'
                    },
                    legend: {
                        data: ['Model Prediction', 'KLime Model Prediction'],
                        top: 20
                    },
                    xAxis: { data: data.columns[data.column_names.indexOf("idx")],
                        axisLabel: { show: false } },
                    yAxis: {},
                    series: [{
                            name: 'Model Prediction',
                            type: 'line',
                            data: data.columns[data.column_names.indexOf("model_pred")],
                            lineStyle: { normal: { width: 0 } },
                            showAllSymbol: true,
                            symbolSize: 1
                        },
                        {
                            name: 'KLime Model Prediction',
                            type: 'line',
                            data: data.columns[data.column_names.indexOf("predict_klime")],
                            lineStyle: { normal: { width: 0 } },
                            showAllSymbol: true,
                            symbolSize: 1
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
    function loadPlot() {
        $('#main').css('height', window.innerHeight).css('width', window.innerWidth);
        var params = new URLSearchParams(document.location.search);
        var interpret_key = params.get("interpret_key");
        $.get("http://localhost:54321/3/InterpretModel/" + interpret_key, function (data) {
            var agg_frame_id = data.interpret_id.name;
            console.log(agg_frame_id);
            plot_klime(agg_frame_id);
            loadSearchBar(data.frame_id.name);
        });
    }
    function loadSearchBar(frame_id) {
        $.get("http://localhost:54321/3/Frames/" + frame_id + "/columns", function (data) {
            var columns = data.frames[0].columns.filter(function (col) { return ["int", "enum"].indexOf(col.type) > 0; });
            var labels = columns.map(function (x) { return x.label; });
            console.log(labels);
            for (var _i = 0, labels_1 = labels; _i < labels_1.length; _i++) {
                var e = labels_1[_i];
                $('<option>').val(e).text(e).appendTo($('#columns'));
            }
        });
    }
    function loadClusterPlot(e) {
        console.log(e);
        loadPlot();
    }
    function main() {
        loadPlot();
        window.onresize = _.debounce(loadPlot, 500);
        $(document).on('click', '#search-trigger', function (e) { loadClusterPlot(e); return true; });
    }
    ModelInterpretability.main = main;
})(ModelInterpretability || (ModelInterpretability = {}));
Zepto(ModelInterpretability.main);
