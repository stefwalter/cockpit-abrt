$( document ).ready( function() {
    /* hide progress scree */
    $("#report-task-progress").hide();

    /* ordered detail elements */
    var detail_elements = ["exploitable",
                           "not-reportable",
                           "reason",
                           "backtrace",
                           "crash_function",
                           "cmdline",
                           "executable",
                           "package",
                           "component",
                           "pid",
                           "pwd",
                           "hostname",
                           "count",
                           "user", /* special element consists from username and (uid) */
                           "type/analyzer", /* special element */
                           "last_occurence"];
    /*
     * In case that you want to display some special element (for example element
     * which is composed of two elements) you have to add its name to the
     * 'detail_element' array, add the name to the 'special_elements' list and
     * define its required content in the function 'get_element_content'.
     *  */
    var special_elements = ["user",
                            "type/analyzer"];

    /* ignored elements */
    var black_list_elements = ["pkg_name",
                               "pkg_version",
                               "pkg_release",
                               "pkg_arch",
                               "pkg_epoch"];

    var problems_client = cockpit.dbus('org.freedesktop.problems');
    var service = problems_client.proxy('org.freedesktop.Problems2', '/org/freedesktop/Problems2');

    var reportd_client  = cockpit.dbus('org.freedesktop.reportd', {bus:'session'});
    var reportd = reportd_client.proxy('org.freedesktop.reportd.Service', '/org/freedesktop/reportd/Service');

    reportd.wait(function() {
            console.log("reportd proxy: " + this.valid);
    });

    /* load all problems */
    service.wait(function() {
        /* cache problem proxies - without this, cockpit can create only single
         * Entry proxy, all other proxies has the property 'invalid' set to
         * True. */
        var problems = problems_client.proxies("org.freedesktop.Problems2.Entry", "/org/freedesktop/Problems2/Entry").wait(function() {
            /* create table rows only for own problems - the problems variable
             * includes proxies for not accessible problems too */
            service.GetProblems(0, {}).done(function(problem_paths, options) {
                for (var i in problem_paths) {
                    add_problem_to_table(problems[problem_paths[i]]);
                }
            });
        });
    });

    $(service).on("Crash", function(event, problem_path, uid) {
        problems_client.proxy('org.freedesktop.Problems2.Entry', problem_path)
             .wait(function() {add_problem_to_table(this);});
    });

    function add_problem_to_table(problem_proxy) {
        if (!problem_proxy.valid) {
            console.log("Invalid Entry proxy '" + problem_proxy.path + "'");
            return;
        }

        var problems = $("#problems tbody").append(problem_to_row(problem_proxy));
        if (reportd.valid) {
            var row = problems.children(".problem").last();
            reportd.GetWorkflows(problem_proxy.path).done(function(args, options) {
                for (w of args) {
                    row.find(".dropdown-menu").append(get_btn_dropdown_li(w[1], w[0]));
                }
            });
        }
    }

    function problem_to_row(problem) {
        var row = "";

        row += "<td>" + new Date(parseInt(problem.LastOccurrence) * 1000).toLocaleString() + "</td>";
        row += "<td>" + escapeHtml(problem.Reason) + "</td>";
        row += "<td>" + escapeHtml(problem.Package[0]) + "</td>";

        var container_elements = ["container_image", "container_id"];
        var data = problem.ReadElements(container_elements, 0x4)
        container_elements.forEach(function(elem) {
            if (!data.hasOwnProperty(elem)) {
                row += "<td></td>";
            }
            else {
                row += "<td>" + escapeHtml(data[elem]) + "</td>";
            }
        });

        row += "<td>" + escapeHtml(problem.Count) + "</td>";

        row += get_action_btn();

        return "<tr id=\"" + problem.path + "\" class=\"problem\">" + row + "</tr><tr class=\"detail_list hidden\"><td colspan=\"7\"></td></tr>";
    }

    function get_action_btn() {
        var btn = ""
        btn += "<td class=\"action_btn\">";
        btn += "<div class=\"btn-group\">";
        btn += "<button class=\"btn btn-default main-btn\" title=\"\">";
        btn += "Delete";
        btn += "</button>";

        btn += "<button class=\"btn btn-default dropdown-toggle\" data-toggle=\"dropdown\">";
        btn += "<span class=\"caret\"></span>";
        btn += "</button>";

        btn += "<ul class=\"dropdown-menu\" role=\"menu\">";
        btn += "</ul>";

        btn += "</div>";
        btn += "</td>";

        return btn;
    }

    function get_btn_dropdown_li(label, tag) {
        var li = "";
        li = "<li class=\"presentation\" data-tag=\"" + tag + "\">";
        li += "<a role=\"menuitem\">";
        li += "<span>" + label + "</span>";
        li += "</a>";
        li += "</li>";

        return li;
    }

    /* problem info click handler */
    $( document ).on('click', '.problem', function() {
        on_problem_row_click(this);
    });

    function on_problem_row_click(problem_html) {
        var detail_row = $(problem_html).next();

        /* detail is shown */
        if ($(problem_html).hasClass("selected_problem")) {

            $(problem_html).removeClass("selected_problem");
            $(detail_row).addClass("hidden");
        }
        /* detail is not displayed, but it is loaded */
        else if ($(detail_row).hasClass("loaded")) {
            $(problem_html).addClass("selected_problem");
            $(detail_row).removeClass("hidden");
        }
        /* detail is not displayed nor loaded */
        else {
            create_detail_table(problem_html);

            $(problem_html).addClass("selected_problem");
            $(detail_row)
                .removeClass("hidden")
                .addClass("loaded");
        }
    }

    function create_detail_table(problem_html) {
        var problem_path = $(problem_html).attr('id');

        service.GetProblemData(problem_path).done(function(args, options){
            var result = create_problem_detail(args);
            var problem_detail_row = $(problem_html).next().children()
            problem_detail_row.append(result);
        });
    }

    function create_problem_detail(problem_data) {
        var text = "";
        /*  show detail_elements */
        for (i = 0; i < detail_elements.length; i++) {
            var elem = detail_elements[i];
            text += create_detail_element(problem_data, elem);
        }

        /* get all keys from problem data (array of all element's names) */
        var problem_data_elems = Object.keys(problem_data);
        problem_data_elems.sort();

        /* display oneline elements from problem data (which are not on black list)*/
        for (var elem_index in problem_data_elems) {

            var elem_name = problem_data_elems[elem_index];
            var elem_data = problem_data[elem_name];
            if (elem_data[2].indexOf('\n') > -1 || (elem_data[0] & 1 /* binary */))
                continue;
            text += create_detail_element(problem_data, elem_name);

            delete problem_data_elems[elem_index];
        }

        /* display DATA_DIRECTORY path */
        text += "<tr class=\"detail\"><td class=\"detail_label\">DATA_DIRECTORY</td><td class=\"detail_content\">" + problem_data["Directory"] + "</td></tr>";

        /* display binary elements from problem data (which are not on black list)*/
        for (var elem_index in problem_data_elems) {

            var elem_name = problem_data_elems[elem_index];
            var elem_data = problem_data[elem_name];
            if ((elem_data[0] & 1 /* binary */) == 0)
                continue;
            text += create_detail_element(problem_data, elem_name);

            delete problem_data_elems[elem_index];
        }

        /* display multiline elements from problem data (which are not on black list)*/
        for (var elem_index in problem_data_elems) {

            var elem_name = problem_data_elems[elem_index];
            text += create_detail_element(problem_data, elem_name);
        }

        /* add instruction how to report problem if problem is not reported and is reportable */
        if (!problem_data.hasOwnProperty("not-reportable")) {
            var reported = false;

            if (problem_data.hasOwnProperty("reported_to")) {
                var reported_to = problem_data["reported_to"][2];
                reported_to = reported_to.split("\n");

                for (var i = 0; i < reported_to.length; ++i) {
                    var line = reported_to[i];
                    if (line.substring(0, 8) != "uReport:" && line.substring(0, 12) != "ABRT Server:" && line != "") {
                        reported = true;
                        break;
                    }
                }
            }
            /* bug is not reported */
            if (reported == false) {
                text += "<tr class=\"how_to_report\"><td colspan=\"2\"><div class=\"inline_block\">Please run the following command on the machine where the crash occurred in order to report the problem:<br/><samp>$ abrt-cli report " + problem_data["Directory"] + "</samp></div></td></tr>";
            }
        }

        return text;
    }

    function create_detail_element(problem_data, elem) {

        var text = "";
        /* skip this element if it is on black list */
        if (black_list_elements.indexOf(elem) > -1)
            return text;

        if (problem_data.hasOwnProperty(elem) || special_elements.indexOf(elem) > -1) {

            var elem_name = {"name": elem};
            var problem_content = get_element_content(problem_data, elem_name);
            elem = elem_name.name;
            if (problem_content != "") {

                var additional_classes = "";
                if (elem == "docker_inspect") {
                    additional_classes += "pre ";
                }

                if (elem == "dso_list") {
                    /* bold name of packages */
                    problem_content = problem_content.replace(/^(\S+\s+)(\S+)(.*)$/gm, "$1<b>$2</b>$3");
                }

                /* clickable url in reported_to */
                if (elem == "reported_to") {
                    /* AAA URL=aaa BBB=bbb -> AAA URL=<a href="aaa" ...>aaa</a> BBB=bbb */
                    problem_content = problem_content.replace(/URL=([^\s]+)(\s|$)/g, "URL=<a href=\"$1\" target=\"_blank\">$1</a>$2");
                }

                if (problem_content.indexOf('\n') != -1) {

                    problem_content = highlight_multiline_items(problem_content, elem);

                    problem_content = problem_content.replace(/\n/g, "<br>");

                    text += "<tr class=\"detail detail_dropdown\"><td class=\"detail_label\">" + elem;
                    text += "</td><td class=\"detail_content\"><span class=\"detail_dropdown_span fa fa-angle-right\"></span></td></tr>";
                    text += "<tr class=\"detail hidden\"><td class=\"detail_label\">";
                }
                else {
                    text += "<tr class=\"detail\"><td class=\"detail_label\">" + elem;
                }
                text += "</td><td class=\"detail_content " + additional_classes + "\">" + problem_content + "</td></tr>";
            }
        }
        return text;
    }

    function highlight_multiline_items(problem_content, elem) {

        /* bold variable 'ABC=abc' -> '<b>ABC=</b>abc' */
        /* we want to highlight only multiline elements */
        if (problem_content.match(/^[^=\n]+=[^\n]*/) != null) {
            problem_content = problem_content.replace(/^([^=\s]+=)(.*)$/gm, "<b>$1</b>$2");
        }

        /* bold variable 'ABC: abc' -> '<b>ABC: </b>abc' */
        if (problem_content.match(/^[^:\n]+:[^\n]*/) != null && elem != "dead.letter") {
            problem_content = problem_content.replace(/^([^:=;\d]+ ?:)(.*)$/gm, "<b>$1</b>$2");
            problem_content = problem_content.replace(/^(\[[^:=;]+\] ?:)(.*)$/gm, "<b>$1</b>$2");
        }

        /* bold titles of items in open_fds */
        if (elem == "open_fds") {
            problem_content = problem_content.replace(/^(\d+:.*\d+)$/gm, "<b>$1</b>");
        }

        return problem_content;
    }

    function get_element_content(problem_data, elem) {

        /* ordinary element */
        if(problem_data.hasOwnProperty(elem.name)) {
            return get_element_content_if_exist(problem_data, elem.name);
        }

        /* special element */
        var text = "";
        switch (elem.name) {
            case "user": /*  username (uid)*/
                var username = get_element_content_if_exist(problem_data, "username");
                var uid = get_element_content_if_exist(problem_data, "uid");
                if (username != "" && uid != "") {
                    text += username;
                    text += " (" + uid + ")";
                    break;
                }
                if (uid != "") {
                    elem.name = "uid";
                    text += uid;
                    break;
                }
                if (username != "") {
                    text += username;
                    break;
                }
                break;
            case "type/analyzer": /*  type/analyzer */
                var type = get_element_content_if_exist(problem_data, "type");
                var analyzer = get_element_content_if_exist(problem_data, "analyzer");
                if (type != "" && analyzer != "") {
                    text += type;
                    text += "/" + analyzer;
                    break;
                }
                if (analyzer == "") {
                    elem.name = "type";
                    text += type;
                    break;
                }
                break;
            default:
                break;
        }
        return text;
    }

    /* get content of element 'elem' if exist and remove it from the problem_data */
    function get_element_content_if_exist(problem_data, elem) {
        if(problem_data.hasOwnProperty(elem)) {
            var content = problem_data[elem][2];

            if (elem == "time" || elem == "last_occurrence") {
                content = new Date(parseInt(content) * 1000).toLocaleString();
            }

            /* binary file */
            if (problem_data[elem][0] & 1 /* 1 is flag for binary file */) {
               var size = humanSize(problem_data[elem][1]);
               content = "$DATA_DIRECTORY/" + elem + " (binary file, " + size + ")";
            }

            /* remove the shown element */
            delete problem_data[elem];
            return escapeHtml(content);
        }
        return "";
    }

    function humanSize(bytes) {
        var thresh = 1024;
        var units = ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];

        if(bytes < thresh) return bytes + ' B';
        var u = -1;
        do {
            bytes /= thresh;
            ++u;
        } while(bytes >= thresh);
        return bytes.toFixed(1)+' '+units[u];
    };

    /* dropdown multiline detail handler */
    $( document ).on('click', '.detail_dropdown', function( event ) {
        event.stopPropagation();
        problem_detail_dropdown_item(this);
    });

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

    /* delete btn handler */
    $( document ).on('click', '.main-btn', function( event ) {
        event.stopPropagation();
        var problem = $(this).closest('tr');
        delete_problem( problem );
    });

    /* delete all btn handler */
    $( document ).on('click', '.delete-all-btn', function( event ) {
        $(".problem").each(function() {
            delete_problem(this);
        });
    });

    $( document ).on('click', '.cancel-task-btn', function( event ) {
        $("#problems-browser").toggle();
        $("#report-task-progress").toggle();
    });

    $( document ).on('click', '.back-to-browser-btn', function( event ) {
        $("#problems-browser").toggle();
        $("#report-task-progress").toggle();
    });

    $( document ).on('click', '.presentation', function( event ) {
        event.stopPropagation();
        var problem = $(this).closest('tr');

        var wf_id = $(this).data("tag");
        var problem_id = $(problem).attr('id');

        reportd.CreateTask(wf_id, problem_id).done(function(task_path, options) {
            var task = reportd_client.proxy("org.freedesktop.reportd.Task", task_path);

            task.wait(function () {
                $("#problems-browser").toggle();
                $("#report-task-progress").toggle();
                $("#report-task-progress-log").empty();
                $(".cancel-task-btn").show();
                $(".back-to-browser-btn").hide();
                $("report-task-progress-spiner").show();

                $(this).on("changed", function(event, data) {
                    if (data.hasOwnProperty("Status") && data.Status == "FINISHED") {
                        $(".cancel-task-btn").hide();
                        $(".back-to-browser-btn").show();
                        $("#report-task-progress-spiner").hide();
                    }
                });

                $(this).on("Progress", function(event, line) {
                    log = line.replace(/(https?[^\s]+)(\s|$)/g, "URL=<a href=\"$1\" target=\"_blank\">$1</a>$2") + "<br/>"
                    $("#report-task-progress-log").append(log);
                });

                this.Start();
            });
        });
    });

    function delete_problem( problem ) {
        var problem_id = $(problem).attr('id');
        var del = service.DeleteProblems([problem_id]);
        del.done(function() {
            $(problem).addClass("hidden");
            /* hide also the problem description */
            $(problem).next().addClass("hidden");
        });
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/\//g, "&#x2F;")
    }
});
