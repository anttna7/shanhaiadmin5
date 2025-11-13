# SHAdmin Deployment Notes

## Current Status

### Technology Stack
- **Go**: 1.24
- **Framework**: Gin 1.11.0
- **Database**: PostgreSQL 18+
- **Frontend**: Pure HTML5 (no Node.js/build tools required)
- **Architecture**: Monolithic (single binary application)

### Completed Modifications
1. ✅ Updated go.mod to Go 1.24 and Gin 1.11.0
2. ✅ Changed module name from `go-admin` to `shadmin`
3. ✅ Rebranded from "Go-Admin" to "SHAdmin" across all files
4. ✅ Created pure HTML5 frontend (login.html, index.html, CSS, JS)
5. ✅ Configured PostgreSQL as primary database in config/settings.yml
6. ✅ Modified routers to serve HTML pages directly (monolithic architecture)
7. ✅ Updated all import paths to use `shadmin/` prefix
8. ✅ Maintained correct third-party dependency paths

### Pending: Vendor Directory Creation

## Issue: Network Restrictions

**Problem**: The build environment has severe network restrictions that prevent downloading Go modules:

- ❌ **goproxy.cn**: Returns 403 Forbidden for all packages
- ❌ **mirrors.aliyun.com/goproxy/**: Returns 403 Forbidden
- ❌ **storage.googleapis.com**: DNS resolution fails (connection refused)
- ❌ **modernc.org**: Direct access returns 403 Forbidden

**Affected Packages**:
- `modernc.org/sqlite` v1.37.0
- `modernc.org/libc` v1.62.1
- `github.com/klauspost/compress` v1.18.0
- All other Go modules when proxy is unavailable

**Attempted Solutions**:
1. ❌ Cleared and regenerated module cache
2. ❌ Tried multiple proxy servers (goproxy.cn, aliyun, goproxy.io)
3. ❌ Attempted direct mode (GOPROXY=direct)
4. ✅ Restored go.sum from git history (partial success - file is incomplete)

## Recommended Solutions

### Option 1: Create Vendor on a Machine with Internet Access (RECOMMENDED)

```bash
# On a machine with proper internet access:
git clone <repository-url>
cd shanhaiadmin5
export GOPROXY=https://goproxy.cn,direct
go mod download
go mod tidy
go mod vendor

# Commit the vendor directory
git add vendor/
git commit -m "feat: add vendor directory for offline deployment"
git push
```

Then pull the vendor directory on the restricted environment:
```bash
git pull
go build -mod=vendor -o shadmin main.go
```

### Option 2: Configure Network Access

Work with your network administrator to:
1. Allow access to `proxy.golang.org` or `goproxy.cn`
2. Allow access to `sum.golang.org` (for checksum verification)
3. Configure corporate proxy settings if applicable:
   ```bash
   export GOPROXY=http://corporate-proxy:port
   export GONOPROXY=none
   export GONOSUMDB=none
   ```

### Option 3: Use Pre-built Binary

Build the application on a machine with internet access and transfer the binary:
```bash
# On build machine:
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o shadmin main.go
tar czf shadmin-binary.tar.gz shadmin config/ static/

# Transfer to target machine
scp shadmin-binary.tar.gz target-machine:/path/
```

## Build Instructions (Once Dependencies Are Available)

### With Vendor Directory
```bash
go build -mod=vendor -o shadmin main.go
```

### Without Vendor (requires internet)
```bash
go mod download
go build -o shadmin main.go
```

### Generate Swagger Documentation
```bash
go generate
# or
swag init --parseDependency --parseDepth=6 --instanceName admin -o ./docs/admin
```

## Database Setup

### PostgreSQL Configuration

1. **Create Database**:
```sql
CREATE DATABASE sh_admin;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE sh_admin TO postgres;
```

2. **Update Configuration** (config/settings.yml):
```yaml
database:
  driver: postgres
  source: host=127.0.0.1 port=5432 user=postgres password=postgres dbname=sh_admin sslmode=disable TimeZone=Asia/Shanghai
```

3. **Run Migrations**:
```bash
./shadmin migrate -c config/settings.yml
```

## Running the Application

```bash
# Development mode
./shadmin server -c config/settings.yml

# Production mode (edit settings.yml first to set mode: prod)
./shadmin server -c config/settings.yml
```

The application will be available at:
- **Web Interface**: http://localhost:8000
- **Login Page**: http://localhost:8000/login
- **API Documentation** (dev only): http://localhost:8000/swagger/admin/index.html

## Directory Structure

```
shadmin/
├── app/
│   ├── admin/          # Admin module
│   │   ├── apis/       # API handlers
│   │   ├── models/     # Data models
│   │   ├── router/     # Route definitions
│   │   └── service/    # Business logic
│   ├── jobs/           # Background jobs
│   └── other/          # Other modules
├── cmd/                # CLI commands
├── common/             # Shared utilities
│   ├── database/       # Database connection
│   ├── middleware/     # HTTP middleware
│   └── global/         # Global variables
├── config/             # Configuration files
│   └── settings.yml    # Main config
├── static/             # Static files (Frontend)
│   ├── html/           # HTML pages
│   ├── css/            # Stylesheets
│   └── js/             # JavaScript
├── docs/               # API documentation
├── go.mod              # Go module definition
├── go.sum              # Dependency checksums
└── main.go             # Application entry point
```

## Frontend Development

The frontend uses pure HTML5 with no build tools required:

- **Login**: `/static/html/login.html` + `/static/js/login.js`
- **Dashboard**: `/static/html/index.html` + `/static/js/app.js`
- **Styles**: `/static/css/style.css`

To modify the frontend, edit the HTML/CSS/JS files directly - no compilation needed.

## Third-party Dependencies

**Critical Dependency**: `github.com/go-admin-team/go-admin-core` v1.5.3-rc.3

This project relies heavily on the go-admin-core framework (206+ references across the codebase). This dependency:
- ✅ Provides core RBAC functionality
- ✅ Includes JWT authentication middleware
- ✅ Offers database utilities and ORM extensions
- ✅ Supplies logging and configuration management
- ❌ **Cannot be removed** without major rewrite

**Note**: If `go-admin-team/go-admin-core` becomes unavailable, the vendor directory becomes ESSENTIAL for project continuity.

## Security Considerations

1. **Change Default Credentials** in production
2. **Configure SSL/TLS** for HTTPS
3. **Update JWT Secret** in config/settings.yml
4. **Enable Rate Limiting** via middleware
5. **Review CORS Settings** for your domain
6. **Disable Swagger** in production (already handled via config check)

## Troubleshooting

### "missing go.sum entry" Error
- **Cause**: Incomplete go.sum file
- **Solution**: Run `go mod tidy` on a machine with internet access, or use vendor directory

### "dial tcp: lookup storage.googleapis.com... connection refused"
- **Cause**: Network/DNS restrictions
- **Solution**: Configure GOPROXY or use vendor directory

### "403 Forbidden" from proxy
- **Cause**: Proxy blocks specific packages
- **Solution**: Use different proxy or create vendor directory offline

### Database Connection Fails
- **Cause**: PostgreSQL not running or incorrect credentials
- **Solution**: Verify PostgreSQL is running and check config/settings.yml

## Next Steps

1. **PRIORITY**: Create vendor directory on a machine with internet access
2. Test database migrations with PostgreSQL 18+
3. Configure production settings (secrets, CORS, domains)
4. Set up systemd service for production deployment
5. Configure nginx/reverse proxy if needed
6. Set up monitoring and logging

## Contact & Support

- **Project**: SHAdmin - Enterprise Admin System
- **Repository**: (add your repository URL)
- **License**: MIT
- **Based on**: go-admin framework

---

**Last Updated**: 2025-11-13 (继续从模块缓存清除后的网络限制问题)
