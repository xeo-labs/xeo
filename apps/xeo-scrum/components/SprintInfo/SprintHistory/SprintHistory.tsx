import { Sprint } from '@prisma/client';
import { Error } from 'components/Error/Error';
import {
  GetSprintHistory,
  SprintHistoryWithStatus,
} from 'pages/api/sprint/[sprintId]/history';
import { useQuery } from 'utils/api';
import { CentredLoader, ExpandableRow, Input, Table } from '@xeo/ui';
import dayjs from 'dayjs';
import { groupBy } from '@xeo/utils';
import { CellProps } from 'react-table';

interface Props {
  sprint: Sprint;
}

export const SprintHistory: React.FunctionComponent<Props> = ({ sprint }) => {
  const { data, error, isLoading } = useQuery<GetSprintHistory>(
    `/api/sprint/${sprint.id}/history`
  );

  if (isLoading) {
    return <CentredLoader />;
  }

  if (error || !data) {
    return (
      <Error errorMessage="Error fetching sprint history, please try again!" />
    );
  }

  const historyByDay = groupBy(data.sprintHistory, (item) =>
    dayjs(item.timestamp).format('YYYY-MM-DD')
  );

  const mapSprintHistoryToRow = (
    history: SprintHistoryWithStatus
  ): SprintHistoryTableRow => ({
    timestamp: history.timestamp,
    pointsLeftDone: 0,
    pointsLeftToValidate: 0,
  });

  const rows: SprintHistoryTableRow[] = Object.keys(historyByDay).map((day) => {
    const [first, ...rest] = historyByDay[day].map(mapSprintHistoryToRow);
    console.log(first, rest, historyByDay[day]);
    return {
      ...first,
      subRows: rest,
    };
  });

  type SprintHistoryTableRow = ExpandableRow<{
    timestamp: Date;
    pointsLeftDone: number;
    pointsLeftToValidate: number;
  }>;

  return (
    <div>
      <h2>History</h2>
      <Table<SprintHistoryTableRow>
        columns={[
          {
            id: 'expander',
            Header: ({ getToggleAllRowsExpandedProps, isAllRowsExpanded }) => (
              <span {...getToggleAllRowsExpandedProps()}>
                Date {isAllRowsExpanded ? '👇' : '👉'}
              </span>
            ),
            Cell: ({
              row,
            }: React.PropsWithChildren<
              CellProps<SprintHistoryTableRow, unknown>
            >) =>
              row.canExpand ? (
                <span
                  {...row.getToggleRowExpandedProps({
                    style: {
                      paddingLeft: `${row.depth * 2}rem`,
                    },
                  })}
                >
                  {row.isExpanded ? '👇' : '👉'}
                </span>
              ) : null,
          },
          {
            id: 'time',

            Header: 'Time',
            Cell: ({
              row,
            }: React.PropsWithChildren<
              CellProps<SprintHistoryTableRow, unknown>
            >) => {
              return (
                <Input
                  label=""
                  defaultValue={dayjs(row.original.timestamp).toISOString()}
                />
              );
            },
          },
          {
            Header: 'Points left done',
            accessor: 'pointsLeftDone',
          },
          {
            Header: 'Points left to validate',
            accessor: 'pointsLeftToValidate',
          },
        ]}
        data={rows}
      />
      <p> {data.sprintHistory.length} Data Points</p>
    </div>
  );
};
