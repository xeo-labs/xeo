import { NotionDatabase, Sprint } from '@prisma/client';
import { useForm } from 'react-hook-form';
import { v4 } from 'uuid';
import React, { useEffect } from 'react';
import { isDeveloperWithCapacityArray } from 'utils/sprint/utils';
import axios from 'axios';
import { PutUpdateSprintRequest } from 'pages/api/team/[teamId]/sprint/[sprintId]';
import { toast } from 'react-toastify';
import {
  SprintCapacityDev,
  SprintCapacityTable,
} from '../SprintCapacityTable/SprintCapacityTable';
import { getBusinessDaysArray } from 'utils/sprint/chart';
import { DeleteSprint } from '../DeleteSprint/DeleteSprint';
import { useRouter } from 'next/router';
import { mutate } from 'swr';
import dayjs from 'dayjs';
import { UserAction, trackSprintAction } from 'utils/analytics';
import Input from '@xeo/ui/lib/Input/Input';
import Button from '@xeo/ui/lib/Button/Button';
import { SettingsPanel } from 'components/PageLayouts/SettingsPanel/SettingsPanel';
import { Tooltip } from 'components/Tooltip/Tooltip';
import { NotionSprintSelector } from '../SprintCreate/NotionSprintSelector';
import { SprintSelectOption } from '../SprintCreate/SprintCreate';
import { getTimeFromUTCTime, getUTCTimeFromTime, Time } from 'utils/date/date';

interface Props {
  sprint: Sprint;
  database: NotionDatabase;
}

interface SprintEditForm {
  startDate: string;
  endDate: string;
  sprintName: string;
  notionSprintValue: SprintSelectOption;
  sprintGoal: string;
  teamSpeed: number;
  dayStartTime: Time;
  devs: SprintCapacityDev[];
}

export const DEFAULT_SPRINT_CAPACITY = 1;

export const SprintEdit: React.FunctionComponent<Props> = ({
  sprint,
  database,
}) => {
  const { push } = useRouter();

  useEffect(() => {
    trackSprintAction({
      action: UserAction.SPRINT_START_EDIT,
      sprintId: sprint.id,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const devs = isDeveloperWithCapacityArray(sprint.sprintDevelopersAndCapacity)
    ? sprint.sprintDevelopersAndCapacity
    : [];

  const form = useForm<SprintEditForm>({
    defaultValues: {
      startDate: dayjs(sprint.startDate).format('YYYY-MM-DDTHH:mm'), // datetime-local requires this format
      endDate: dayjs(sprint.endDate).format('YYYY-MM-DDTHH:mm'), // datetime-local requires this format
      notionSprintValue: {
        value: sprint.notionSprintValue,
        label: sprint.notionSprintValue,
      },
      dayStartTime: getTimeFromUTCTime(sprint.dailyStartTime as Time),
      sprintName: sprint.name,
      sprintGoal: sprint.sprintGoal,
      teamSpeed: sprint.teamSpeed,
      devs: devs.map((dev) => ({ ...dev, id: v4() })),
    },
  });

  const { register, watch, handleSubmit } = form;

  const updateSprint = async (data: SprintEditForm) => {
    trackSprintAction({
      action: UserAction.SPRINT_SAVE_EDIT,
      sprintId: sprint.id,
    });

    const daysInSprint = getBusinessDaysArray(
      new Date(data.startDate),
      new Date(data.endDate)
    );

    const body: PutUpdateSprintRequest['request'] = {
      input: {
        name: data.sprintName,
        goal: data.sprintGoal,
        startDate: dayjs(data.startDate).toISOString(),
        endDate: dayjs(data.endDate).toISOString(),
        teamSpeed: data.teamSpeed,
        notionSprintValue: data.notionSprintValue.value,
        dayStartTime: getUTCTimeFromTime(data.dayStartTime),
        developers: data.devs.map((dev) => ({
          name: dev.name,
          capacity: dev.capacity
            .map((capacity) =>
              capacity === null || capacity === undefined
                ? DEFAULT_SPRINT_CAPACITY
                : capacity
            )
            .slice(0, daysInSprint.length),
        })),
      },
    };

    const result = await axios.put<PutUpdateSprintRequest['response']>(
      `/api/team/${sprint.teamId}/sprint/${sprint.id}`,
      body
    );

    if (result.status !== 200) {
      toast.error(result.data);
    }

    toast.success('Sprint updated');
    push(`/team/${sprint.teamId}`);
    mutate(`/api/team/${sprint.teamId}/sprint/${sprint.id}`);
  };

  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const teamSpeed = watch('teamSpeed');

  return (
    <div>
      <form className="gap-4" onSubmit={handleSubmit(updateSprint)}>
        <h2>Notion Options</h2>
        <SettingsPanel>
          <div className="grid grid-cols-3 gap-4">
            {/* @ts-ignore */}
            <NotionSprintSelector form={form} database={database} />
          </div>
        </SettingsPanel>
        <h2>Sprint Details</h2>
        <SettingsPanel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Sprint Name"
              {...register('sprintName', { required: true })}
            />
            <Input
              label="Team Speed"
              type="number"
              step={0.05}
              {...register('teamSpeed', { required: true })}
            />
          </div>
          <Input
            className="mt-4"
            label="Sprint Goal"
            {...register('sprintGoal', { required: true })}
            placeholder="AaU I can..."
          />
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Tooltip tooltip="Exactly when sprint starts">
              <Input
                type="datetime-local"
                label="Start Time"
                {...register('startDate', { required: true })}
              />
            </Tooltip>
            <Tooltip tooltip="Exactly when sprint ends">
              <Input
                type="datetime-local"
                label="End Time"
                {...register('endDate', { required: true })}
              />
            </Tooltip>
            <Tooltip tooltip="Before this time, points moved count towards yesterday">
              <Input
                type="time"
                label="Daily Start Time"
                {...register('dayStartTime', { required: true })}
              />
            </Tooltip>
          </div>
        </SettingsPanel>
        <SprintCapacityTable
          startDate={new Date(startDate)}
          endDate={new Date(endDate)}
          teamSpeed={teamSpeed}
          form={form}
          defaultCapacity={DEFAULT_SPRINT_CAPACITY}
          devFieldName="devs"
          devNameFieldNameFactory={(devIndex) => `devs.${devIndex}.name`}
          capacityFieldNameFactory={(devIndex, capacityIndex) =>
            `devs.${devIndex}.capacity.${capacityIndex}`
          }
        />
        <div className="flex flex-row gap-2 mt-4">
          <DeleteSprint sprint={sprint} />
          <Button type="submit">Save</Button>
        </div>
      </form>
    </div>
  );
};
