<html>
<header>
    <!-- Load D3.js -->

    <script src="../../node_modules/d3/dist/d3.min.js"></script>

    <!-- Load billboard.js with style -->
    <script src="../../node_modules/billboard.js/dist/billboard.js"></script>
    <link rel="stylesheet" href="../../node_modules/billboard.js/dist/billboard.css">

    <!-- Load bootstrap style -->
    <link rel="stylesheet" href="../../node_modules/bootstrap/dist/css/bootstrap.css">

    <style>

    </style>
</header>

    <body>
        <div class="container-fluid">
            <h1>Geek lab metrics</h1>
            <hr/>
            <div class="row">
              {{#each generatedOverallGraph}}
                  <div class="col-md-6">
                    <div id="{{id}}"></div>
                    <script>
                      var chart = bb.generate({
                        data: {
                          type: "{{ type }}",
                          columns: {{{ data }}} ,
                          labels: true
                        },
                        "tooltip": {
                          "order": "desc"
                        },
                        zoom: {
                          enabled: {
                              type: "drag"
                          }
                        },
                        axis : {
                          x: {
                            label: {
                              text: 'date',
                            },
                            type: "category",
                            {{#if categories}}
                              categories: {{{ categories }}} ,
                            {{/if}}
                            tick: {
                              fit: true,
                            },
                          },
                          y: {
                            label: {
                              text: 'usage',
                            },
                          }
                        },
                        bindto: '#{{id}}',
                        title: {
                          text: '{{name}}'
                        },
                        grid: {
                          x: {
                            show: true
                          },
                          y: {
                            show: true,
                          }
                        },
                        legend: {
                          show: true
                        }
                      });
                    </script>
                  </div>
              {{/each}}

            </div>
            <hr/>
            {{#each generatedeEachActionlGraph}}
              {{#if openNewRow}}
                <div class = "row">
              {{/if}}
                <div class="col-md-4">
                  <div id="{{id}}"></div>
                  <script>
                    var chart = bb.generate({
                      data: {
                        type: "{{ type }}",
                        columns: [
                          {{{ data }}}
                        ],
                        labels: true
                      },
                      "tooltip": {
                        "order": "desc"
                      },
                      zoom: {
                        enabled: {
                            type: "drag"
                        }
                      },
                      axis : {
                        x: {
                          label: {
                            text: 'date',
                          },
                          type: "category",

                          categories: {{{ categories }}} ,

                          tick: {
                            fit: true,
                          },
                        },
                        y: {
                          label: {
                            text: 'usage',
                          },
                        }
                      },
                      bindto: '#{{id}}',
                      title: {
                        text: 'Usage of "{{name}}" per day'
                      },
                      grid: {
                        x: {
                          show: true
                        },
                        y: {
                          show: true,
                        }
                      },
                      legend: {
                        show: false
                      }
                    });
                  </script>
                </div>
              {{#if closeRow}}
              </div>
              <hr/>
              {{/if}}
          {{/each}}
        </div>
    </body>
</html>