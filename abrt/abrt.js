$( document ).ready( function() {
    var required_elements = ["time", "reason", "package", "container_image", "container_id", "count"];
    var detail_elements = ["reason", "backtrace", "cmdline", "executable", "package", "component", "pid", "hostname", "count", "first_occurence", "last_occurence", "user", "type", "duphash", "os_release", "abrt_version", "runlevel", "kernel", "architecture", "uuid", "ureports_counter", "data_directory", "reported_to", "os_info", "environ"];
    var dropdown_elements = ["backtrace", "", ""]

    var service = cockpit.dbus('org.freedesktop.problems');
    var problems = service.proxy('org.freedesktop.problems', '/org/freedesktop/problems');

    problems.wait(load_problems);

    function load_problems() {
        problems.GetAllProblems()
            .done(function(args, options) {
                args.forEach(function(problem_id) {
                    problems.GetProblemData(problem_id)
                        .done(function(problem_data, options) {
                            $("#problems tbody").append(problem_data_to_row(problem_data, problem_id));
                });
            });
        });
    }

    function problem_data_to_row(problem_data, problem_id) {
        var row = "";

        required_elements.forEach(function(elem) {
            row += "<td>" + format_problem_data(problem_data, elem) + "</td>";
        });

        row += get_action_btn();

        return "<tr id=\"" + problem_id + "\" class=\"problem\">" + row + "</tr><tr class=\"detail_list hidden\"><td colspan=\"7\"></td></tr>";
    }

    function format_problem_data(problem_data, elem) {
        if (!problem_data.hasOwnProperty(elem)) {
            return "";
        }

        var value = problem_data[elem][2];

        if (elem == "time") {
            value = new Date(parseInt(value) * 1000).toLocaleString();
        }

        return value;
    }

    function get_action_btn() {
        var btn = "<td class=\"action_btn\">";
        btn += "<div class=\"btn-group\">";
        btn += "<button class=\"btn btn-default main-btn\" title=\"\">";
        btn += "Delete";

/* Prepared for adding another functionality
 *
        btn += "</button>";
        btn += "<button class=\"btn btn-default dropdown-toggle\" data-toggle=\"dropdown\">";
        btn += "<span class=\"caret\"></span>";
        btn += "</button>";

        btn += "<ul class=\"dropdown-menu\" role=\"menu\">";
        btn += get_btn_dropdown_li("Report");
        btn += get_btn_dropdown_li("Detail");
        btn += "</ul>";
*/

        btn += "</div>";
        btn += "</td>";

        return btn;
    }

    function get_btn_dropdown_li(label) {
        var li = "<li class=\"presentation\">";
        li += "<a role=\"menuitem\">";
        li += "<span>" + label + "</span>";
        li += "</a>";
        li += "</li>";

        return li;
    }

    $( document ).on('click', '.problem', function() {
        problem_detail(this);
    });

    $( document ).on('click', '.detail_dropdown', function( event ) {
        event.stopPropagation();
        problem_detail_dropdown_item(this);
    });

    $( document ).on('click', '.main-btn', function( event ) {
        event.stopPropagation();
        var problem = $(this).closest('tr');
        delete_problem( problem );
    });

    function delete_problem( problem ) {
        var problem_id = $(problem).attr('id');
        var del = problems.DeleteProblem([problem_id]);
        del.done(function() {
            //console.log(problem_id + " deleted.");
            $(problem).addClass("hidden");
            $(problem).next().addClass("hidden");
        });
    }

    function problem_detail( problem ) {
        var detail_row = $(problem).next();

        /* detail is shown */
        if ($(problem).hasClass("selected_problem")) {

            $(problem).removeClass("selected_problem");
            $(detail_row).addClass("hidden");
        }
        /* detail is not displayed, but it is loaded */
        else if ($(detail_row).hasClass("loaded")) {
            $(problem).addClass("selected_problem");
            $(detail_row).removeClass("hidden");
        }
        /* detail is not displayed nor loaded */
        else {
            create_detail_table(problem);

            $(problem).addClass("selected_problem");
            $(detail_row)
                .removeClass("hidden")
                .addClass("loaded");
        }
    }

    function problem_detail_dropdown_item( item ) {

        var desc = $(item).next();
        var dropdown_title = $(item).find("span");

        /* show detail */
        if ($(desc).hasClass("hidden")) {
            $(desc).removeClass("hidden");
            $(dropdown_title).addClass("fa-angle-down");
            $(dropdown_title).removeClass("fa-angle-right");
        }
        /* hide detail */
        else {
            $(desc).addClass("hidden");
            $(dropdown_title).addClass("fa-angle-right");
            $(dropdown_title).removeClass("fa-angle-down");
        }
    }

    function create_detail_table(row) {
        var problem_id = $(row).attr('id');

        problems.GetProblemData(problem_id)
            .done(function(problem_data, options) {

                var result = create_detail(problem_data, problem_id);

                $(row).next().children().append(result);
            });
    }

    function create_detail(problem_data, problem_id) {
        var text = "";
        for (i = 0; i < detail_elements.length; i++) {
            var elem = detail_elements[i];
            if(problem_data.hasOwnProperty(elem)) {

                var problem_content = problem_data[elem][2];

                if (problem_content.indexOf('\n') != -1) {
                    problem_content = problem_content.replace(/</g, "&lt;");
                    problem_content = problem_content.replace(/>/g, "&gt;");
                    problem_content = problem_content.replace(/\n/g, "<br>");
                    /* bold variable */
                    problem_content = problem_content.replace(/(<br>[^=]+=|^[^=]+=)/g, "<b>$1</b>");

                    text += "<tr class=\"detail detail_dropdown\"><td class=\"detail_label\">" + elem;
                    text += "</td><td class=\"detail_content\"><span class=\"detail_dropdown_span fa fa-angle-right\"></span></td></tr>";
                    text += "<tr class=\"detail hidden\"><td class=\"detail_label\">";
                }
                else {
                    text += "<tr class=\"detail\"><td class=\"detail_label\">" + elem;
                }
                text += "</td><td class=\"detail_content\">" + problem_content + "</td></tr>";

            }
        }

        if (!problem_data.hasOwnProperty("not-reportable")) {
            if (problem_data.hasOwnProperty("reported_to")) {
                var reported_to = problem_data["reported_to"][2];
                reported_to = reported_to.replace(/uReport.*\n/g, "");
                reported_to = reported_to.replace(/ABRT Server.*\n/g, "");
                if (reported_to == "") {
                    text += "<tr class=\"how_to_report\"><td></td><td>Run \'abrt-cli report " + problem_id + "\' for reporting this problem.</td></tr>";
                }
            }
        }

        return text;
    }

    $( document ).on('click', '.delete-all-btn', function( event ) {
        $(".problem").each(function() {
            delete_problem(this);
        });
    });
});
