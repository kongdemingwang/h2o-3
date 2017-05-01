//Object.defineProperty(exports, "__esModule", { value: true });
//import * as echarts from 'echarts';
//var echarts = require("echarts");
//import ECharts = echarts.ECharts;
//import EChartOption = echarts.EChartOption;
function main() {
    $.ajax({
        type: "POST",
        url: "http://localhost:54321/3/Vis/Stats",
        data: JSON.stringify({ "graphic": { "type": "stats",
                "parameters": { "digits": 3, "data": true } },
            "data": { "uri": "titanic_input.hex" } }),
        contentType: "application/json",
        success: function (data) {
            console.log(data);
            var myChart = echarts.init(document.getElementById('main'));
            // specify chart configuration item and data
            var option = {
                title: {
                    text: 'ECharts entry example'
                },
                tooltip: {},
                legend: {
                    data: ['Sales']
                },
                xAxis: {
                    data: ["shirt", "cardign", "chiffon shirt", "pants", "heels", "socks"]
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
    });
}
Zepto(main);
//# sourceMappingURL=proto.js.map