   
    let drinkDefaults = {}

    let app = new Vue({
      el: '#app',
      data: {
        message: 'Hello Vue!',
        defaults: drinkDefaults,
        currentVolume: 0
      },
      methods: {
        setVolume: function(e) {
          console.log(e)

          if (e.target.nodeName === "LI") {
            app.currentVolume = parseInt(e.target.childNodes[0].data)
          } else {
            app.currentVolume = parseInt(e.target.parentElement.childNodes[0].data)
          }
          $('.dropdown-menu').classList.remove('show')
        }
      }
  
    })

    fetch('./defaults.json')
    .then(function(response) {
      return response.json()
    })
    .then(function(response) {
      console.log(app.defaults)
      app.defaults = response
      console.log(app.defaults)
    })




    $('.form_datetime').datetimepicker({
      weekStart: 1,
      todayBtn: 1,
      autoclose: 1,
      todayHighlight: 1,
      startView: 2,
      forceParse: 0,
      showMeridian: 1
    });

    $('form').submit(function(e){
      e.preventDefault();
      let data = $('form').serialize();
      if ($("#finished_time").val() == "")
        data = data.replace("&finished_time=", "");

      $.post( "http://s0.trm.io:3000/drinks", data)
        .done(function(data) {
          alert("Success!")
        })
    })