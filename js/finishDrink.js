fetch("http://s0.trm.io:3000/drinks?finished_time=is.null")
.then(function (resp) { return resp.json(); })
.then(function (drinks) {
    console.log(drinks);
    const cookieValue = document.cookie.replace(/(?:(?:^|.*;\s*)authToken\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    window.vueInstance = new Vue({
        el: "#data",
        data: {
            "drinks": drinks
        },
        methods: {
            finishDrink: function (drinkId) {
                console.log(drinkId);
                fetch("http://s0.trm.io:3000/drinks?id=eq." + drinkId, {
                    method: "PATCH",
                    headers: {
                        // 'Authorization': "Bearer " + cookieValue,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        "finished_time": moment().format("YYYY-MM-DD HH:mm:ss")
                    })
                }).then(function (resp) {
                    setTimeout(function () {
                        window.location.href = window.location.href;
                    }, 200)
                    return resp.json();
                }).then(console.log, console.error);
            }
        }
    });
})