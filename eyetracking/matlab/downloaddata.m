function downloaddata(yyyymmdd)
if nargin < 1
    % if no date specified, use today's date
    yyyymmdd = datestr(now,'yyyymmdd');
end

fname = [yyyymmdd '.csv'];
if exist(fname,'file')
    warning('File %s already exists; overwriting',fname);
end

url = ['http://users.sussex.ac.uk/~ad374/eyetracking/server/download_data.php?sid=' yyyymmdd];
disp(['Downloading from ' url]);
urlwrite(url,fname);
