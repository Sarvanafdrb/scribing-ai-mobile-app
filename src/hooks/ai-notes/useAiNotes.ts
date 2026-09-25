import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { aiNotesService } from "@/services/ai-notes.service";

import { aiNotesKeys, sessionKeys } from "@/services/query-keys";

import { useSession } from "@/hooks/sessions/useSession";

import { isTranscriptAvailable, isReviewReady } from "@/utils/session-status.utils";

import { PIPELINE_POLL_MS } from "@/constants/config";

import type { AiNotes, UpdateAiNotesData } from "@/types/ai-notes.types";

import { aiJobsService, hasActiveAiJob } from "@/services/ai-jobs.service";



export const useAiNotes = (sessionId?: string) => {

  const { data: session } = useSession(sessionId);

  const queryClient = useQueryClient();



  const aiJobsQuery = useQuery({

    queryKey: [...aiNotesKeys.all, "jobs", sessionId || ""],

    queryFn: () => aiJobsService.list(sessionId!),

    enabled: Boolean(sessionId),

    refetchInterval: (query) =>

      hasActiveAiJob(query.state.data) ? PIPELINE_POLL_MS : false,

  });



  const query = useQuery({

    queryKey: aiNotesKeys.detail(sessionId || ""),

    queryFn: () => aiNotesService.get(sessionId!),

    enabled: Boolean(sessionId) && isTranscriptAvailable(session?.status),

    staleTime: 5 * 1000,

    refetchInterval: (q) => {

      if (q.state.data?.status === "processing") return PIPELINE_POLL_MS;

      if (hasActiveAiJob(aiJobsQuery.data, "ai_notes")) return PIPELINE_POLL_MS;

      return false;

    },

  });



  const generate = useMutation({

    mutationFn: (force?: boolean) =>

      aiNotesService.generate(sessionId!, Boolean(force)),

    retry: false,

    onSuccess: async () => {

      if (!sessionId) return;

      await queryClient.invalidateQueries({

        queryKey: aiNotesKeys.detail(sessionId),

      });

      await queryClient.invalidateQueries({

        queryKey: sessionKeys.detail(sessionId),

      });

      await queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });

      await queryClient.invalidateQueries({

        queryKey: [...aiNotesKeys.all, "jobs", sessionId],

      });

    },

  });



  const update = useMutation({

    mutationFn: (data: UpdateAiNotesData) =>

      aiNotesService.update(sessionId!, data),

    onSuccess: (data, variables) => {

      if (!sessionId) return;

      queryClient.setQueryData<AiNotes | null | undefined>(

        aiNotesKeys.detail(sessionId),

        (previous) => {

          if (!previous) return data;

          return {

            ...previous,

            ...data,

            medications:

              variables.medications ?? data.medications ?? previous.medications,

          };

        },

      );

    },

  });



  const aiNotesJobActive = hasActiveAiJob(aiJobsQuery.data, "ai_notes");



  return {

    ...query,

    aiNotes: query.data,

    aiJobs: aiJobsQuery.data,

    generate,

    update,

    isGenerating:

      generate.isPending ||

      query.data?.status === "processing" ||

      aiNotesJobActive,

  };

};

