package cmd

import (
	"errors"
	"fmt"
	"github.com/shadmin-team/shadmin-core/sdk/pkg"
	"shadmin/cmd/app"
	"shadmin/common/global"
	"os"

	"github.com/spf13/cobra"

	"shadmin/cmd/api"
	"shadmin/cmd/config"
	"shadmin/cmd/migrate"
	"shadmin/cmd/version"
)

var rootCmd = &cobra.Command{
	Use:          "shadmin",
	Short:        "shadmin",
	SilenceUsage: true,
	Long:         `shadmin`,
	Args: func(cmd *cobra.Command, args []string) error {
		if len(args) < 1 {
			tip()
			return errors.New(pkg.Red("requires at least one arg"))
		}
		return nil
	},
	PersistentPreRunE: func(*cobra.Command, []string) error { return nil },
	Run: func(cmd *cobra.Command, args []string) {
		tip()
	},
}

func tip() {
	usageStr := `欢迎使用 ` + pkg.Green(`shadmin `+global.Version) + ` 可以使用 ` + pkg.Red(`-h`) + ` 查看命令`
	usageStr1 := `也可以参考 https://doc.shadmin.dev/guide/ksks 的相关内容`
	fmt.Printf("%s\n", usageStr)
	fmt.Printf("%s\n", usageStr1)
}

func init() {
	rootCmd.AddCommand(api.StartCmd)
	rootCmd.AddCommand(migrate.StartCmd)
	rootCmd.AddCommand(version.StartCmd)
	rootCmd.AddCommand(config.StartCmd)
	rootCmd.AddCommand(app.StartCmd)
}

//Execute : apply commands
func Execute() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(-1)
	}
}
