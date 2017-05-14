var savedData;
var myChart;
var agg_frame_id; // the aggregator frame
var frame_id; // the original input frame
var klime_frame_id; // the klime frame (contains reason codes)
var ModelInterpretability;
(function (ModelInterpretability) {
    function plot_klime(data, title, single_row) {
        var option = {
            title: {
                text: title,
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
                    symbolSize: 1,
                    markLine: {
                        data: [{
                            name: "Row Queried",
                            xAxis: 2000
                        },
                        {
                            name: "foo",
                            xAxis: 2000
                        }]
                    }
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
        if (single_row == null) {
            console.log("no single row to append");
        }
        myChart.setOption(option);
    }
    function load_klime(frame_key) {
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
                savedData = data;
                plot_klime(data, "Global KLIME Plot", null);
                // plot by klime cluster
                // click / select id value, generate cluster, permanent pinned row for that query
            }
        });
    }
    function loadPage() {
        $('#main').css('height', window.innerHeight).css('width', window.innerWidth);
        var params = new URLSearchParams(document.location.search);
        var interpret_key = params.get("interpret_key");
        $.get("http://localhost:54321/3/InterpretModel/" + interpret_key, function (data) {
            agg_frame_id = data.interpret_id.name;
            klime_frame_id = data.klime_frame_id.name;
            frame_id = data.frame_id.name;
            console.log(agg_frame_id);
            load_klime(agg_frame_id);
            loadSearchBar(frame_id);
        });
    }
    function resizePlot() {
        $('#main').css('height', window.innerHeight).css('width', window.innerWidth);
        myChart.resize();
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
    function loadTable(data) {
        // create a table with data from pre-klime frame
        console.log(data);
    }
    function plotCluster(data) {
        console.log(data);
        var cluster_col = data.frames[0].columns.filter(function (x) { return x.label == "cluster_klime"; });
        var clusterNumber = cluster_col[0].data[0];
        var new_columns = [];
        var cluster_idx = savedData.column_names.indexOf("cluster_klime");
        var modelpred_idx = savedData.column_names.indexOf("model_pred");
        var single_row_pushed = false;
        for (var i = 0; i < savedData.number_of_columns; i++) {
            new_columns.push([]);
        }
        for (var i = 0; i < savedData.number_of_rows; i++) {
            if (savedData.columns[cluster_idx][i] == clusterNumber) {
                for (var j = 0; j < savedData.number_of_columns; j++) {
                    new_columns[j].push(savedData.columns[j][i]);
                }
                // push the one row if its right above the current model pred score
                if (!single_row_pushed &&
                    data.frames[0].columns[modelpred_idx].data[0] <= savedData.columns[modelpred_idx][i]) {
                    for (var j = 0; j < savedData.number_of_columns; j++) {
                        if (savedData.number_of_columns - j < 3) {
                            new_columns[j].push(NaN);
                        }
                        else {
                            new_columns[j].push(data.frames[0].columns[j].data[0].toFixed(4));
                        }
                    }
                    single_row_pushed = true;
                }
            }
        }
        var new_data = savedData;
        new_data.columns = new_columns;
        plot_klime(new_data, "Cluster " + clusterNumber + " KLIME Plot", null);
    }
    function pullOneRow(data) {
        // get one row from the orig frame as well as the klime frame for the RCs
        $.get("http://localhost:54321/3/Frames/" + frame_id + "?row_count=1&row_offset=" + data.next, function (data) { return loadTable(data); });
        $.get("http://localhost:54321/3/Frames/" + klime_frame_id + "?row_count=1&row_offset=" + data.next, function (data) { return plotCluster(data); });
    }
    function loadClusterPlot(e) {
        console.log(e);
        $.get("http://localhost:54321/3/Find?key=" + frame_id + "&column=" + $('#columns').val() +
            "&match=" + $('#search-value').val() + "&row=0&_exclude_fields=key", function (data) {
            pullOneRow(data);
        });
    }
    function main() {
        myChart = echarts.init(document.getElementById('main'));
        loadPage();
        window.onresize = _.debounce(resizePlot, 500);
        $(document).on('click', '#search-trigger', function (e) { loadClusterPlot(e); return true; });
    }
    ModelInterpretability.main = main;
})(ModelInterpretability || (ModelInterpretability = {}));
Zepto(ModelInterpretability.main);
