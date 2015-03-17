$( document ).ready( function() {
    var required_elements = ["time", "reason", "package", "container_image", "container_id", "count"];
    var detail_elements = ["reason", "backtrace", "cmdline", "executable", "package", "component", "pid", "hostname", "count", "first_occurence", "last_occurence", "user", "type", "duphash", "os_release", "abrt_version", "runlevel", "kernel", "architecture", "uuid", "ureports_counter", "data_directory", "reported_to", "os_info", "environ"];

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

        return "<tr id=\"" + problem_id + "\" class=\"problem\">" + row + "</tr><tr class=\"hidden\"><td colspan=\"6\"></td></tr>";
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

    $( document ).on('click', '.problem', function() {

        var detail_row = $(this).next();

        /* detail is shown */
        if ($(this).hasClass("selected_problem")) {

            $(this).removeClass("selected_problem");
            $(detail_row).addClass("hidden");
        }
        /* detail is not displayed, but it is loaded */
        else if ($(detail_row).hasClass("loaded")) {
            $(this).addClass("selected_problem");
            $(detail_row).removeClass("hidden");
        }
        /* detail is not displayed nor loaded */
        else {
            create_detail_table(this);

            $(this).addClass("selected_problem");
            $(detail_row)
                .removeClass("hidden")
                .addClass("loaded");
        }
    });

    function create_detail_table(row) {
        var problem_id = $(row).attr('id');

        problems.GetProblemData(problem_id)
            .done(function(problem_data, options) {

                var result = create_detail(problem_data, problem_id);

                //$(result).insertAfter(row);
                $(row).next().children().append(result);
            });
    }

    function create_detail(problem_data, problem_id) {
        var text = "";
        for (i = 0; i < detail_elements.length; i++) {
            var elem = detail_elements[i];
            if(problem_data.hasOwnProperty(elem)) {

                var problem_content = problem_data[elem][2];
                problem_content = problem_content.replace(/\n/g, "<br>");
                /* bold variable */
                problem_content = problem_content.replace(/([A-Z_]+=)/g, "<b>$1</b>");

                text += "<tr class=\"detail\"><td class=\"detail_label\">" + elem + "</td><td class=\"detail_content\">" + problem_content + "</td></tr>";
            }
        }
        return text;
    }


});
