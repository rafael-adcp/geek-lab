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
            {{#each generatedOverallGraph}}
              <div class="row">
                  <div class="col-md-6">
                      <div id="{{id}}"></div>
                      <script>
                          var chart = bb.generate({
                              data: {
                                   type: "{{ type }}",
                                  columns: {{{ data }}} ,
                                  labels: true
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
                                    fit: false,
                                  },
                                },
                                y: {
                                  label: {
                                    text: 'value',
                                  },
                                  {{#if menor}}
                                  min: {{ menor }}
                                  {{/if}}
                                }
                              },
                              bindto: '#{{id}}',
                              title: {
                                  text: '{{name}}'
                              },
                              {{#if media}}
                                grid: {
                                    x: {
                                        show: true
                                    },

                                    y: {
                                        show: true,
                                        lines: [
                                            { value: {{media}}, class: '', text: 'Media: {{media}}'},

                                        ]
                                    }
                                },
                              {{/if}}
                              legend: {
                                  show: true
                              }
                          });
                      </script>
                      {{#if metrics}}
                        <table class="table table-bordered" style = 'text-align: center'>
                        <thead>
                            <tr>
                                <th scope="col">Menor</th>
                                <th scope="col">Media</th>
                                <th scope="col">Maior</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{{menor}}</td>
                                <td>{{media}}</td>
                                <td>{{maior}}</td>
                            </tr>
                        </tbody>
                        </table>
                      {{/if}}
                  </div>
              </div>
            {{/each}}
            <hr>
        </div>
    </body>
</html>