AC_INIT([cockpit-abrt], [0.1], [crash-catcher@fedorahosted.org], [cockpit-abrt])

INTLTOOL_REQ=0.35.0

AC_CONFIG_MACRO_DIR([build/m4])
AC_CONFIG_AUX_DIR([build])

AM_INIT_AUTOMAKE([-Wall foreign tar-ustar])
AM_SANITY_CHECK

# Support silent build rules. Disable by either passing --disable-silent-rules
# to ./configure or passing V=1 to make
m4_ifdef([AM_SILENT_RULES], [AM_SILENT_RULES])
# The 'yes' argument is undocumented but it is common knowledge that it works.
AM_SILENT_RULES([yes])
AM_MAINTAINER_MODE([enable])
AC_CONFIG_SRCDIR([abrt/abrt.js])

AM_PROG_AR

AC_ARG_WITH([cockpitmodulesdir],
            AS_HELP_STRING([--with-cockpitmodulesdir=DIR],
                           [Default dump location ('DATADIR/cockpit')]),
            [],
            [with_cockpitmodulesdir=${datadir}/cockpit])
AC_SUBST(COCKPIT_MODULES_DIR, [$with_cockpitmodulesdir])

AC_CONFIG_FILES([
        Makefile
])
AC_OUTPUT
