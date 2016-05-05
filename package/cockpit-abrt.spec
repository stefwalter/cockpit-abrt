%global commit 5d0a94c308718ac499f988bbe857c8d5d8b098b7
%global shortcommit %(c=%{commit}; echo ${c:0:7})
Name:		cockpit-abrt
Version:	0.1
Release:	1%{?dist}
Summary:	ABRT module for Cockpit

Group:		System/Utilities
License:	GPLv2+
URL:		https://github.com/abrt/cockpit-abrt/
#Source0:	https://github.com/abrt/%%{name}/archive/%%{commit}/%%{name}-%%{version}-%%{shortcommit}.tar.gz
Source0:	https://github.com/abrt/%{name}/archive/%{commit}/%{name}-%{version}.tar.gz

BuildArch: noarch

Requires:	cockpit
Requires:	reportd
Requires:	abrt-dbus

%description
This Cockpit package adds a new item called Problems to the Tools menu. The
module displays list of problems detect by ABRT and allows its users to view
problem details and report the problems to external bug trackers.


%prep
%setup -q


%build
%configure
make %{?_smp_mflags}


%install
%make_install


%files
%doc README.md
%{_datadir}/cockpit/abrt

%changelog
* Thu May 5 2016 Jakub Filak <jfilak@redhat.com> - 0.1-1
- Initial packaging
