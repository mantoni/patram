export type CliCommandName = 'check' | 'fields' | 'query' | 'queries' | 'show';
export type CliHelpTopicName = 'query-language';
export type CliHelpTargetKind = 'root' | 'command' | 'topic';

export type CliOutputMode = 'default' | 'plain' | 'json';

export type CliColorMode = 'auto' | 'always' | 'never';

export interface ParsedCliCommandRequest {
  kind?: 'command';
  color_mode: CliColorMode;
  command_arguments: string[];
  command_name: CliCommandName;
  output_mode: CliOutputMode;
  query_inspection_mode?: 'explain' | 'lint';
  query_limit?: number;
  query_offset?: number;
}

export interface ParsedCliHelpRequest {
  kind: 'help';
  target_kind: CliHelpTargetKind;
  target_name?: CliCommandName | CliHelpTopicName;
}

export type ParsedCliArguments = ParsedCliCommandRequest;
export type ParsedCliRequest = ParsedCliCommandRequest | ParsedCliHelpRequest;

export type CliParseError =
  | {
      code: 'message';
      message: string;
    }
  | {
      code: 'missing_required_argument';
      argument_label: string;
      command_name: 'query' | 'show';
    }
  | {
      code: 'option_not_valid_for_command';
      command_name: CliCommandName;
      token: string;
    }
  | {
      code: 'unknown_command';
      suggestion?: CliCommandName;
      token: string;
    }
  | {
      code: 'unknown_help_target';
      suggestion?: CliCommandName | CliHelpTopicName;
      token: string;
    }
  | {
      code: 'unknown_option';
      command_name?: CliCommandName;
      suggestion?: string;
      token: string;
    };

export type ParseCliArgumentsResult =
  | {
      success: true;
      value: ParsedCliRequest;
    }
  | {
      error: CliParseError;
      success: false;
    };
