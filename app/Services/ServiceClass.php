<?php

namespace App\Services;


use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;

class ServiceClass
{

    // upload file function
    static function uploadFile($file, $path)
    {
        $filePath = $file->store($path, 'public');
        return $filePath;
    }


    //update file function
    static function updateFile($file, $path, $oldFilePath)
    {
        // Delete old file
        self::deleteFile($oldFilePath);
        // Upload new file
        return self::uploadFile($file, $path);
    }



    // Upload multiple images function

    public static function uploadMultipleImages( $data, string $inputName, $model, string $relation, string $directory, int $maxFiles ) 
    {
        $files = [];

        if ($data instanceof \Illuminate\Http\Request && $data->hasFile($inputName)) {
            $files = $data->file($inputName);
        } elseif (is_array($data) && isset($data[$inputName])) {
            $files = $data[$inputName];
        }

        if (empty($files)) {
            return true;
        }

        if (!is_array($files)) {
            $files = [$files];
        }

        if (count($files) > $maxFiles) {
            return "You can upload a maximum of {$maxFiles} images.";
        }

        foreach ($files as $image) {
            $path = $image->store($directory, 'public');
            $model->$relation()->create([
                'image' => $path
            ]);
        }

        return true;
    }


      /**
     * Replace old file with a new one (for video/pdf).
     */

    public static function updateMultipleImages(Request $request,string $inputName, $model, string $relation, string $directory,  int $maxFiles )
    {
        if (!$request->hasFile($inputName)) {
            return true;
        }

        $images = $request->file($inputName);

        if (count($images) > $maxFiles) {
            throw new \Exception("You can upload a maximum of {$maxFiles} images.");
        }

        foreach ($model->$relation as $oldImage) {
            if (Storage::disk('public')->exists($oldImage->image)) {
                Storage::disk('public')->delete($oldImage->image);
            }
        }
        $model->$relation()->delete();

        foreach ($images as $image) {
            $path = $image->store($directory, 'public');
            $model->$relation()->create(['image' => $path]);
        }

        return true;
    }



    //delete file function
    public static function deleteFile(?string $filePath, string $disk = 'public'): void
    {
        if ($filePath && Storage::disk($disk)->exists($filePath)) {
            Storage::disk($disk)->delete($filePath);
        }
    }

  /**
     * Upload file and delete old one if exists.
     *
     * @param  UploadedFile|null  $file
     * @param  string  $folder
     * @param  string|null  $oldFile
     * @return string|null
     */
    
    static function uploadUpdateFile($file, string $folder, ?string $oldFile = null): ?string
    {
        if (!$file) {
            return $oldFile; 
        }

        if ($oldFile && Storage::disk('public')->exists($oldFile)) {
            Storage::disk('public')->delete($oldFile);
        }

        return $file->store($folder, 'public');
    }



    /**
     * Delete multiple related images from storage and database.
     */

    public static function deleteMultipleImages($model, string $relationName, string $disk = 'public'): void
    {
        if ($model->$relationName && $model->$relationName->count() > 0) {
            foreach ($model->$relationName as $item) {
                if (!empty($item->image) && Storage::disk($disk)->exists($item->image)) {
                    Storage::disk($disk)->delete($item->image);
                }
            }
            $model->$relationName()->delete(); // Remove DB records
        }
    }

}

