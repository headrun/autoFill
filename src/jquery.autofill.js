;(function ($) {
  "use strict";

  var UP    = 38,
      DOWN  = 40,
      RIGHT = 39,
      LEFT  = 37,
      ENTER = 13,
      ESC   = 27;

  var widgetHtml = "<div class='jq-af-widget'></div>";

  var dropdownHtml = "<ul class='dropdown-menu af-dropdown-menu'></ul>";

  function getItemHtml (value) {

    return "<li><a href='#'>" + value + "</a></li>";
  }

  function generateAutoFill ($autoFillDD, items) {

    $autoFillDD.empty();

    $.each(items, function (i, item) {

      $autoFillDD.append($(getItemHtml(item)));
    });
  }

  function searchValues (term, totalData) {

    var subset = [];

    if (term.length === 0) {

      return totalData;
    }

    var regexp = new RegExp(".*" + term + ".*", "i");

    $.each(totalData, function (i, entry) {

      if(regexp.test(entry)){

        subset.push(entry);
      }
    });

    return subset;
  }

  function populateAutoFill (term, totalData, $autoFillDD) {

    var data = searchValues(term, totalData);

    generateAutoFill($autoFillDD, data);
  }

  var autofillInstances = [];

  function AutoFill ($node, options) {

    var $widget = $(widgetHtml);

    $widget.insertBefore($node);

    $node.appendTo($widget);

    $node.addClass("af-input");

    var that        = this;
    var $autoFillDD = $(dropdownHtml).insertAfter($node);
    var data        = options.data || [];

    this.el      = $node.get(0);
    this.$el     = $node;
    this.options = options;

    this.setData = function (newData) {

      data = newData;

      options.data = data;

      populateAutoFill($node.val(), data, $autoFillDD);

      return that.$el;
    };

    this.getData = function () {

      return data;
    };

    function addSelection () {

      var selectedText = $autoFillDD.find("li.selected").text();

      if (options.preAdd &&
            options.preAdd.apply(that, [selectedText, $node]) === false) {

        return;
      }

      $node.val(selectedText);
      hideAutoFill();

      if (options.postAdd) {

        options.postAdd(selectedText, $node);
      }
    }

    function onKeyUp (e) {

      var key = e.which;

      if($.inArray(key, [UP, DOWN, ENTER, ESC]) < 0){

        populateAutoFill($node.val(), data, $autoFillDD);
        showAutoFill();

        return;
      }

      var $li = $autoFillDD.children("li");

      if($li.length === 0){

        return;
      }

      var $selectedItem = $li.filter(".selected");

      if($selectedItem.length === 0){

        if(key === UP){

          $selectedItem = $li.eq(0);
        }else if(key === DOWN){

          $selectedItem = $li.eq($li.length - 1);
        }
      }

      var selectedItemIndex = $li.index($selectedItem);

      switch(key){

        case UP:

          selectedItemIndex--;
          break;

        case DOWN:

          selectedItemIndex++;
          break;

        case ENTER:

          //TODO: the following should be done when opted for strictly from the
          //values of dropdown
          //Do nothing when nothing is selected
          if ($selectedItem.length === 0) {

            return;
          }

          addSelection();

          if($selectedItem.next().length > 0){

            $selectedItem.next().addClass("selected");
          }else {

            $selectedItem.prev().addClass("selected");
          }

          $selectedItem.remove();

          return;

        case ESC:

          hideAutoFill();

          return;
      }

      if(selectedItemIndex < 0){

        selectedItemIndex += $li.length;
      }else if(selectedItemIndex >= $li.length) {

         selectedItemIndex %= $li.length;
      }

      $selectedItem.removeClass("selected");
      $li.eq(selectedItemIndex).addClass("selected");
    }

    var showAutoFill = this.showAutoFill = function () {

      populateAutoFill($node.val(), data, $autoFillDD);
      $autoFillDD.show();
    };

    var hideAutoFill = this.hideAutoFill = function () {

      $autoFillDD.hide();
    };

    function onBlur (e) {

      var target = e.target;

      if(target !== $autoFillDD.get(0) && target !== $node.get(0)){

        hideAutoFill();
      }
    }

    var bindEvents = function () {

      $node.on("focus", showAutoFill)
         .on("keyup", onKeyUp);

      $("html").on("click", onBlur);

      $autoFillDD.on("click", "li", function (e) {

        e.preventDefault();

        $(this).addClass("selected")
             .siblings(".selected")
             .removeClass("selected");

        addSelection();
        hideAutoFill();
      });
    };

    function unbindEvents () {

    }

    bindEvents();
    this.collection.push(this);
  }

  var collection = AutoFill.prototype.collection = [];

  function getInstance (el) {

    var instance = null;

    $.each(collection, function () {

      if (this.el === el) {

        instance = this;
      }
    });

    return instance;
  }

  var optionMethodMap = {

    "data": {

          "getter": "getData",
          "setter": "setData"
        }
  };

  var autoFill = function () {

    var $this = $(this);

    //IF the element doesn't exist
    if($this.length === 0){

      return $this;
    }

    //Converting arguments to array
    var args = Array.prototype.slice.apply(arguments, []);

    var options;

    var existingInstance = getInstance($this.get(0));

    if (args.length === 0) {

      options = args[0] = {};
    }else if (args.length === 1 && typeof args[0] === "object") {

      options = args[0];
    }else if (args.length > 1 && args[0] === "options") {

      if (!existingInstance) {

        throw Error("Trying to set options before even initialization");
      }

      var method = optionMethodMap[args[1]];

      if (!method) {

        throw Error("Invalid Option");
      }

      // if args length is 2 its a getter
      if (args.length === 2){

        return existingInstance[method.getter]();
      }
      // if args length is 3, its a setter
      else if (args.length === 3) {

        existingInstance[method.setter](args[2]);

        return existingInstance.$el;
      }
    }else {

      throw Error("Invalid Arguments");
    }

    return $.each($this, function () {

           autofillInstances.push(new AutoFill($(this), options));
         });
  };

  $.fn.autoFill = autoFill;

}(jQuery));
