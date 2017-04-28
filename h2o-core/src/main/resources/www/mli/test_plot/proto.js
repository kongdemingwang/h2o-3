function main() {
    $.ajax({
        type: "POST",
        url: "http://localhost:54321/3/Vis/Stats",
        data: JSON.stringify({ "graphic": { "type": "stats",
                "parameters": { "digits": 3, "data": true } },
            "data": { "uri": "py_2_sid_a551" } }),
        contentType: "application/json",
        success: function (data) {
            console.log(data);
        }
    });
}
Zepto(main);
//# sourceMappingURL=proto.js.map