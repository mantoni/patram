export type CliCommandName = 'check' | 'query' | 'queries' | 'show';

export type CliOutputMode = 'default' | 'plain' | 'json';

export type CliColorMode = 'auto' | 'always' | 'never';

export interface ParsedCliArguments {
  color_mode: CliColorMode;
  command_arguments: string[];
  command_name: CliCommandName;
  output_mode: CliOutputMode;
}

export type ParseCliArgumentsResult =
  | {
      success: true;
      value: ParsedCliArguments;
    }
  | {
      message: string;
      success: false;
    };
