// Static class for handling globa/common methods and variables
var Global = create(function() {

  /*** Settings ***/

  this.set({
    Language: {
      country      : 'Denmark',
      languageCode : 'da',
      countryCode  : 'dk',
      days         : ['Søndag','Mandag','Tirsdag','Onsdag','Torsdag','Fredag','Lørdag'],
      months       : ['Januar','Februar','Marts','April','Maj','Juni','Juli','August','September','Oktober','November','December']
    }
  });


  /*** Private ***/

  var that = this;


  /*** Public ***/

  this.Date = {
    seconds: function(ms) {
      return ms/1000;
    },
    minutes: function(ms) {
      return this.seconds(ms)/60;
    },
    hours: function(ms) {
      return this.minutes(ms)/60;
    },
    days: function(ms) {
      return this.hours(ms)/24;
    },
    getDayName: function(date, lowercase) {
      var pos = date.getDay();
      var day = that.Language.days[pos];
      if(lowercase) day = day.toLowerCase();
      return day;
    },
    getShortDayName: function(date, lowercase) {
      return this.getDayName(date, lowercase).substr(0, 3);
    },
    getMonthName: function(date, lowercase) {
      var pos = date.getMonth();
      var month = that.Language.months[pos];
      if(lowercase) month = month.toLowerCase();
      return month;
    },
    getShortMonthName: function(date, lowercase) {
      return this.getMonthName(date, lowercase).substr(0, 3);
    },
    format: function(date, format) {
      // Format date to string using standart string date format: http://msdn.microsoft.com/en-us/library/8kb3ddd4.aspx
      if(!format) return date.toString();

      // Year
      var year = date.getFullYear();
      format = format.replace(/yyyy/g, year);
      format = format.replace(/yy/g, year.toString().substr(-2));

      // Month
      var month = date.getMonth();
      format = format.replace(/MMMM/g, this.getMonthName(date));
      format = format.replace(/MMM/g, this.getShortMonthName(date));
      format = (month > 8) ? format.replace(/MM/g, 'M') : format.replace(/MM/g, '0M');
      format = format.replace(/M/g, month + 1);

      // Day
      format = format.replace(/dddd/g, this.getDayName(date));
      format = format.replace(/ddd/g, this.getShortDayName(date));

      // Date
      var day = date.getDate();
      format = (day > 9) ? format.replace(/dd/g, 'd') : format.replace(/dd/g, '0d');
      format = format.replace(/d/g, day);

      // Hours
      var hours = date.getHours();
      format = (hours > 9) ? format.replace(/HH/g, 'H') : format.replace(/HH/g, '0H');
      format = format.replace(/H/g, hours);
      format = (hours % 12 > 9) ? format.replace(/hh/g, 'h') : format.replace(/hh/g, '0h');
      format = format.replace(/h/g, hours % 12);

      // Minutes
      var minutes = date.getMinutes();
      format = (minutes > 9) ? format.replace(/mm/g, 'm') : format.replace(/mm/g, '0m');
      format = format.replace(/m/g, minutes);

      return format;

    }
  };

  this.Distance = {
    round: function(km) {
      var formattedDistance;
      if(km <= 0.9) {
        formattedDistance = Math.ceil(km * 10) * 100 + ' m';
      } else if(km <= 1.9) {
        formattedDistance = Math.ceil(km * 10) / 10 + ' km';
      } else if(km <= 4.5) {
        formattedDistance = Math.ceil(km * 2) / 2 + ' km';
      } else if(km <= 14) {
        formattedDistance = Math.ceil(km) + ' km';
      } else if(km <= 45) {
        formattedDistance = Math.ceil(km / 5) * 5 + ' km';
      } else {
        formattedDistance = Math.ceil(km / 10) * 10 + ' km';
      }
      return formattedDistance;
    }
  };

  this.Cookie = {
    set: function(name, value, days) {
      var expires;
      if(days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
      } else {
        expires = "";
      }
      document.cookie = name + "=" + value + expires + "; path=/";
    },
    get: function(name) {
      var nameEQ = name + "=";
      var ca = document.cookie.split(';');
      for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while(c.charAt(0) == ' ') c = c.substring(1, c.length);
        if(c.indexOf(nameEQ) === 0) {
          return c.substring(nameEQ.length, c.length);
        }
      }
      return null;
    },
    'delete': function(name) {
      this.set(name, "", -1);
    }
  };

  this.String = {
    stripTags: function(html) {
      var tmp = document.createElement("div");
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText;
    }
  };

  this.Style = {
    getPrefix: function(propName) {
      var style = document.documentElement.style,
        prefixes = 'Moz Webkit O Ms'.split(' '),
        prefixed;

      // test standard property first
      if(typeof style[propName] === 'string') return propName;

      // capitalize
      propName = propName.charAt(0).toUpperCase() + propName.slice(1);

      // test vendor specific properties
      for(var i = 0, len = prefixes.length; i < len; i++) {
        prefixed = prefixes[i] + propName;
        if(typeof style[prefixed] === 'string') return prefixed;
      }
    },
    set: function(el, propName, val) {
      var prefix = this.getPrefix(propName);
      if (propName && el.style[propName]) {
        el.style[propName] = val;
        return true;
      }
      return false;
    }
  };

});