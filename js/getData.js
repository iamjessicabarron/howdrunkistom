Chart.defaults.global.defaultFontFamily = "'Rubik'"

var bevChart = new Chart(document.getElementById("drunk-this-week"),
{
    "type": "bar",
    "data": {
        "labels": ["January", "February", "March", "April", "May", "June", "July"],
        "datasets": [{
            "label": "Standard Drinks",
            "data": [65, 59, 80, 81, 56, 55, 40],
            "fill": false,
            "backgroundColor": ["rgb(0, 0, 0)", "rgb(0, 0, 0)", "rgb(0, 0, 0)", "rgb(0, 0, 0)", "rgb(0, 0, 0)", "rgb(0, 0, 0)", "rgb(0, 0, 0)"],
            "borderColor": ["rgb(0, 0, 0)", "rgb(0, 0, 0)", "rgb(0, 0, 0)", "rgb(0, 0, 0)", "rgb(0, 0, 0)", "rgb(0, 0, 0)", "rgb(0, 0, 0)"],
            "borderWidth": 1
        }]
    },
    "options": {
        "scales": {
            "yAxes": [{
                "ticks": {
                    "beginAtZero": true
                }
            }],
            "xAxes": [{
                "ticks": {
                    "autoSkip": false,
                    "maxRotation": 90,
                    "minRotation": 90
                }
            }]
        },
        "legend": {
            "display": false
        }
    }
}
);
const query_start = moment().subtract(6 + (6 * 24), 'hours').hours(6).minutes(0).seconds(0);
fetch("http://s0.trm.io:3000/drinks?started_time?gt." + query_start.format("YYYY-MM-DD[T]HH:mm:ss")).then((resp) => resp.json()).then((data) => {
    const day_items = [query_start];
    for (var i = 0; i <= 6; i++) {
        day_items.push(query_start.clone().add((i + 1), 'days'));
    }
    var items_by_day = [[], [], [], [], [], [], []];
    let points_of_interest = [];
    data.forEach((drink) => {
        drink.started_time = moment(drink.started_time);
        if (drink.finished_time !== null) {
            drink.finished_time = moment(drink.finished_time);
        } else {
            drink.finished_time = drink.started_time.clone().add(30, 'minutes');
        }
        points_of_interest.push(drink.started_time.clone());
        points_of_interest.push(drink.finished_time.clone().add(30, 'minutes'));
        let last_day = null;
        for (var i = 0; i < 7; i++) {
            if (drink.started_time.isAfter(day_items[i]) && (i == 6 || drink.started_time.isBefore(day_items[i+1])) ){
                items_by_day[i].push(drink);
                break;
            }
        }
    })
    points_of_interest.sort((a, b) => a.diff(b, 'seconds', true));
    points_of_interest = points_of_interest.map((poi) => ({
        x: poi,
        y: -0.16,
    }));
    data.forEach((drink) => {
        const query = ({ x }) => x.isSameOrAfter(drink.started_time) && x.isBefore(drink.finished_time.clone().add(30, 'minutes'));
        const relevant_pois = _.filter(points_of_interest, query);
        const rise = 0.806 * 1.2 * drink.volume * (drink.abv / 100) / (0.58 * 95);
        const run = drink.finished_time.diff(drink.started_time, 'hours', true) + 0.5;
        const grad = rise / run;
        console.log({
            'drink': drink,
            'relevant': relevant_pois,
            'grad': grad,
        })
        for (var poi of relevant_pois) {
            poi.y += grad;
        }
    })

    const bar_chart_data = []
    for (var i = 0; i < 7; i++) {
        const day = day_items[i];
        const items = items_by_day[i];

        let sum = 0;
        for (var item of items) {
            sum += item.volume * item.abv * 0.78924 / (100 * 10);
        }

        bar_chart_data.push({
            'x': day.format("YYYY-MM-DD"),
            'y': sum,
        })
    }
    bevChart.data.datasets[0].data.splice(0, bevChart.data.datasets[0].data.length);
    bevChart.data.labels.splice(0, bevChart.data.labels.length);
    bar_chart_data.forEach(({x, y}) => {
        bevChart.data.labels.push(x);
        bevChart.data.datasets[0].data.push(y);
    });
    bevChart.update();

    console.log(points_of_interest);

    let line_chart_data = [];
    for (var i = 0; i < points_of_interest.length; i++) {
        if (line_chart_data.length === 0 || i === 0) {
            line_chart_data.push({
                "x": points_of_interest[i].x,
                "y": 0,
            })
            continue
        }
        const run = points_of_interest[i].x.diff(points_of_interest[i - 1].x, 'hours', true);
        let y = points_of_interest[i - 1].y * run + line_chart_data[i - 1].y;
        if (y < 0) {
            y = 0;
            const end = points_of_interest[i - 1].x.clone().add(
                (0 - line_chart_data[i - 1].y) / points_of_interest[i - 1].y,
                'hours'
            );

            points_of_interest.splice(i, 0, {
                "x": end,
                "y": 0,
            });
            line_chart_data.push({
                "x": end,
                "y": 0,
            });
            i--;
        } else {
            line_chart_data.push({
                "x": points_of_interest[i].x.clone(),
                "y": y
            });
        }
    }
    let sober_time = null;
    if (points_of_interest.length > 0) {
        const last = points_of_interest[points_of_interest.length - 1];
        const last_data = line_chart_data[line_chart_data.length - 1];
        sober_time = last_data.x.clone().add(last_data.y / 0.16, 'hours');
        line_chart_data.push({
            x: sober_time,
            y: 0
        });
    }
    console.log(line_chart_data);
    var bacChart = new Chart(document.getElementById("drunk-over-time"), {
        "type": "line",
        "data": {
            "datasets": [{
                "label": "Estimated BAC",
                "data": line_chart_data.map(({
                    x,
                    y
                }) => ({
                    t: x.toDate(),
                    y: y
                })),
                "fill": false,
                "borderColor": "rgb(0, 0, 0)",
                "lineTension": 0.1
            }]
        },
        "options": {
            "scales": {
                xAxes: [{
                    type: "time",
                    distribution: "linear",
                    time: {
                        unit: "minute",
                        min: moment().subtract(18, 'hours').toDate(),
                        max: moment().add(6, 'hours').toDate(),
                        stepSize: 90,
                    },
                    ticks: {
                        autoSkip: false,
                        maxRotation: 90,
                        minRotation: 90
                    }
                }]
            },
            "legend": {
                "display": false
            }
        }
    });
    let lastBefore = null, firstAfter = null;
    const now = moment();
    for (var i= 0; i < line_chart_data.length; i++){
        if (line_chart_data[i].x.isBefore(now)) lastBefore = line_chart_data[i];
        if (line_chart_data[i].x.isAfter(now)){
            firstAfter = line_chart_data[i];
            break;
        }
    }
    let currentBac = null;
    if (lastBefore === null){
        currentBac = "not known";
    } else if (firstAfter === null){
        currentBac = "0.00"
    } else {
        const rise = firstAfter.y - lastBefore.y;
        const run = firstAfter.x.diff(lastBefore.x, 'seconds', true);
        const miniRun = now.diff(lastBefore.x, 'seconds', true);
        currentBac = Math.round(1000 * rise * miniRun/run) / 1000;
    }



    const bacEl = document.getElementById("current-bac");
    const soberAtEl = document.getElementById("sober-at");
    soberAtEl.innerHTML = sober_time.format("hh:mm a")
    bacEl.innerHTML = currentBac;

    let drunkenness = Math.round(currentBac * 5 / 0.2), note = "Tom's not drunk at all right now";
    drunkenness = Math.min(4, Math.max(0, drunkenness)) + 1;

    const noteEl = document.getElementById("note");
    const scaleEl = document.getElementById("drunk-scale");

    switch (drunkenness) {
        case 2:
            note = "Tom's got some booze in him"
            break;
        case 3:
            note = "Tom's getting tipsy"
            break;

        case 4:
            note = "Tom's pretty lit"
            break;

        case 5:
            note = "Tom's wasted"
            break;

        default:
            break;
    }

    noteEl.innerHTML = note

    let scaleText = ""
    for (let i = 0; i < parseInt(drunkenness) && i <= 5; i++) {
        scaleText += "o"
    }

    scaleEl.innerHTML = scaleText


});