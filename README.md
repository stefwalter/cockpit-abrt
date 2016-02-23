cockpit-abrt
============

This Cockpit package adds a new item called Problems to the Tools menu. The
module displays list of problems detect by ABRT and allows its users to view
problem details and report the problems to external bug trackers.

![Cockpit ABRT](https://mhabrnal.fedorapeople.org/media/cockpit-abrt/main_look.png)

Overview
--------

The module gets the displayed data from `org.freedesktop.problems` D-Bus service:
https://jfilak.fedorapeople.org/ProblemsAPI/

Installation
------------

First of all you need to install ABRT problem hooks and ABRT's implementation
of the Problems D-Bus service:
http://abrt.readthedocs.org/en/latest/installation.html

Once you have ABRT up & running, place the abrt sub-directory to one of the
Cockpit's directories for packages:
* ~/.local/share/cockpit/
* /usr/local/share/cockpit/
* /usr/share/cockpit/

See Cockpit's documentation for more details:
http://cockpit-project.org/guide/latest/packages.html

TODO
====
* register the Crash signal and update the UI when a new crash appears
* enable reporting
