FROM centos:centos7

RUN (cd /lib/systemd/system/sysinit.target.wants/; for i in *; do [ $i == \
systemd-tmpfiles-setup.service ] || rm -f $i; done); \
rm -f /lib/systemd/system/multi-user.target.wants/*;\
rm -f /etc/systemd/system/*.wants/*;\
rm -f /lib/systemd/system/local-fs.target.wants/*; \
rm -f /lib/systemd/system/sockets.target.wants/*udev*; \
rm -f /lib/systemd/system/sockets.target.wants/*initctl*; \
rm -f /lib/systemd/system/basic.target.wants/*;\
rm -f /lib/systemd/system/anaconda.target.wants/*;

RUN yum -y update && yum -y groupinstall 'Development Tools' \
&& yum -y install epel-release \
&& yum -y update && yum -y install \
        wget \
        libtool \
        autotools-dev \
        libssl-dev \
        zlib-devel \
        autoconf \
        automake \
        tcl \
        cmake \
        openssl-devel \
        git \
        zip \
        unzip \
        gcc \
        gcc-c++ \
        readline-devel \
        zlib-devel \
        bison \
        flex \
        ant \
        postgresql-devel \
        jansson-devel \
        postgresql-libs \
        mod_dav_svn subversion \
        libtool-ltdl-devel \
        python3

RUN adduser pgspider
RUN echo "1" | passwd pgspider --stdin
RUN yum -y install libaio.x86_64 libaio-devel.x86_64 net-tools numactl numactl-devel \
&& yum -y install libtiff libtiff-devel libxml2 libxml2-devel libcurl libcurl-devel which \
&& yum -y install centos-release-scl-rh \
&& yum -y install https://download.postgresql.org/pub/repos/yum/reporpms/EL-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm
RUN yum -y remove postgresql-devel postgresql-libs \
&& yum install -y postgresql14.x86_64 postgresql14-devel.x86_64 postgresql14-libs.x86_64
RUN yum -y install lz4 lz4-devel

WORKDIR /home/pgspider
USER pgspider

RUN git config --global http.sslVerify false
RUN git clone -b master https://github.com/pgspider/pgspider.git

WORKDIR /home/pgspider/pgspider
RUN ./configure --prefix=$(pwd)/install
RUN make clean && make && make install


WORKDIR /home/pgspider/pgspider/contrib/pg_stat_statements
RUN make clean && make && make install

WORKDIR /home/pgspider
COPY ./init_pgspider.sh /home/pgspider
COPY ./init.sql /home/pgspider

USER root
RUN chmod +x /home/pgspider/init_pgspider.sh

EXPOSE 4813
ENTRYPOINT ["/usr/sbin/init"]
