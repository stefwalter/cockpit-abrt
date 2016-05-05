dist_doc_DATA = README.md

cockpitabrtdir=$(COCKPIT_MODULES_DIR)/abrt
dist_cockpitabrt_DATA= \
        abrt/manifest.json \
        abrt/abrt.css \
        abrt/abrt.html \
        abrt/abrt.js

RPM_DIRS = --define "_sourcedir $(abs_top_srcdir)" \
	--define "_specdir $(abs_top_srcdir)/package" \
	--define "_builddir $(abs_top_srcdir)/package/rpmbuild/BUILD" \
	--define "_rpmdir $(abs_top_srcdir)/package/rpmbuild/RPMS" \
	--define "_srcrpmdir $(abs_top_srcdir)/package/rpmbuild/SRPMS"

rpm:
	autoconf --force
	$(MAKE) dist
	rpmbuild $(RPM_DIRS) -ba package/cockpit-abrt.spec

srpm:
	autoconf --force
	$(MAKE) dist
	rpmbuild $(RPM_DIRS) -bs package/cockpit-abrt.spec
