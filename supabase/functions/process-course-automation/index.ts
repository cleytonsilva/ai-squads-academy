import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerationJob {
  id: string;
  type: string;
  status: string;
  input: any;
  output?: any;
  error?: string;
  created_by?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get pending course cover generation jobs
    const { data: jobs, error: jobsError } = await supabaseClient
      .from('generation_jobs')
      .select('*')
      .eq('type', 'course_cover_generation')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(5); // Process up to 5 jobs at a time

    if (jobsError) {
      throw new Error(`Error fetching jobs: ${jobsError.message}`);
    }

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending jobs found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const processedJobs = [];

    for (const job of jobs as GenerationJob[]) {
      try {
        // Mark job as processing
        await supabaseClient
          .from('generation_jobs')
          .update({ status: 'processing' })
          .eq('id', job.id);

        const { course_id, course_title, course_description } = job.input;

        // Call the generate-course-images function
        const { data: imageResult, error: imageError } = await supabaseClient.functions.invoke(
          'generate-course-images',
          {
            body: {
              courseId: course_id,
              engine: 'proteus' // Use default engine
            }
          }
        );

        if (imageError) {
          throw new Error(`Image generation failed: ${imageError.message}`);
        }

        // Mark job as completed
        await supabaseClient
          .from('generation_jobs')
          .update({
            status: 'completed',
            output: {
              success: true,
              course_image_generated: true,
              timestamp: new Date().toISOString()
            }
          })
          .eq('id', job.id);

        processedJobs.push({
          job_id: job.id,
          course_id,
          status: 'completed',
          message: 'Course cover generated successfully'
        });

      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
        
        // Mark job as failed
        await supabaseClient
          .from('generation_jobs')
          .update({
            status: 'failed',
            error: error.message || 'Unknown error occurred'
          })
          .eq('id', job.id);

        processedJobs.push({
          job_id: job.id,
          course_id: job.input?.course_id,
          status: 'failed',
          error: error.message || 'Unknown error occurred'
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed_jobs: processedJobs.length,
        jobs: processedJobs
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-course-automation:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});